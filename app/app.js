/**
 * app.js
 *
 * To start the processing cluster, run: `node app.js`.
 *
 */

var kue = require('kue')
  , cluster = require('cluster')
  , fs = require('fs-extra')
  , path = require('path')
  , watch = require('watch')
  , sqldb = require('./lib/sqldb')
  , process_sqlite = require('./lib/process_sqlite')
  , process_pcap = require('./lib/process_pcap');


(function() {

  // return boolean environment value or default if not defined
  var getbool = function(key, defaultv) {
    var string = process.env[key] || '';  
    switch (string.toLowerCase().trim()) {
      case "true": case "yes": case "1": return true;
      case "false": case "no": case "0": return false;
      default: return defaultv;
    }
  }

  // return integer environment value or default if not defined
  var getint = function(key, defaultv) {
    var string = process.env[key];  
    if (string) {
      var v = parseInt(string.trim());
      if (!isNaN(v)) return v;
    }
    return defaultv;
  }

  // Global configuration
  var datadir = process.env.PROCESS_DATA_DIR||'/tmp';
  var config = {
    incoming_dir: datadir+'/incoming',              // incoming files
    processed_dir: datadir+'/processed',            // processed files
    failed_dir: datadir+'/failed',                  // failed files
    enable_watch: getbool('PROCESS_WATCH',false),   // monitor incoming files ?
    retry: getint('PROCESS_RETRY',3),               // number of retries
    workers: getint('PROCESS_WORKERS',1),           // num worker threads
    concurrency: getint('PROCESS_CONCURRENCY',5),   // num jobs / worker
    redis: process.env.PROCESS_REDIS||undefined,    // redis url (or use default)
    db: process.env.PROCESS_DB||undefined           // postgresql url (or use default)
  }

  // Ensure we're in the project directory, so relative paths work as expected
  // no matter where we actually run from.
  process.chdir(__dirname);

  try {
    // Ensure all target dirs are available
    fs.ensureDirSync(config.incoming_dir);
    fs.ensureDirSync(config.processed_dir);
    fs.ensureDirSync(config.failed_dir);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  // the processing task queue
  var queue = kue.createQueue({redis : config.redis});

  // the incoming files monitor
  var monitor = undefined;

  if (cluster.isMaster) {

    // master thread 
    console.log('Starting the master process ... stop with Ctrl^C');
    console.log(JSON.stringify(config,null,2));

    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, closing the workers ...');

      if (monitor) monitor.stop();

      queue.shutdown(5000, function(err) {
        console.log( 'Shutdown: ', err||'' );
        process.exit(0);
      });
    });

    // start the workers
    for (var i = 0; i < config.workers; i++) {
      cluster.fork();
    }

    // Redis error etc.
    queue.on('error', function(err) {
      console.error('Queue error', err);
    });

    // handlers for job lifecycle events
    queue.on('job enqueue', function(id) { 
      console.log('New job #%d', id);

    }).on('job failed', function(id, message) {
      console.error('Job #%d failed %s',  id, message);

      kue.Job.get(id, function(err, job){
        if (err) return console.error(err);

        job.remove(function(err){
          if (err) return console.error(err);
          console.log('Removed job #%d', job.id);
        });

        // move the file to the failed folder
        var dst = job.data.filename.replace(config.incoming_dir, config.failed_dir);
        fs.move(job.data.filename, dst, function (err) {
          if (err) return console.error(err)
          console.log('File stored as %s', dst);
        });
      });

    }).on('job complete', function(id, result) {
      console.log('Job #%d completed %s',  id, result);

      kue.Job.get(id, function(err, job){
        if (err) return console.error(err);

        job.remove(function(err){
          if (err) return console.error(err);
          console.log('Removed job #%d', job.id);
        });

        // move the file to the processed folder
        var dst = job.data.filename.replace(config.incoming_dir, config.processed_dir);
        fs.move(job.data.filename, dst, function (err) {
          if (err) return console.error(err)
          console.log('File stored as %s', dst);
        });
      });

    });

    var enqueue = function(path) {
      queue.create('incoming', { filename : path })
        .attempts(config.retry)
        .save(function(err) {
          if (err) console.error('Failed to create job', err);
        });
    }

    // scan incoming for any non-processed files
    fs.walk(config.incoming_dir)
      .on('data', function(item) {
        if (item.stats && item.stats.isFile()) enqueue(item.path);
      })
      .on('end', function () {
        if (config.enable_watch) {
          console.log('Master start watcher ... ');
          // start a watcher for new incoming files - the monitor will keep the master process alive
          watch.createMonitor(config.incoming_dir, function(m) {
            monitor = m;
            monitor.on("created", function(path, stats) {
              if (stats.isFile()) enqueue(path);
            });
          });

        } else {
          // wait for all the jobs to be processed and exit
          console.log('Master waiting for the workers to finish ... ');
          queue.shutdown(function() {
            console.log('Master shutting down!');
            process.exit(0);
          });
        }
      });

  } else {
    // in the worker

    var db = new sqldb.DB(config.db);

    queue.process('incoming', config.concurrency, function(job, done) {

      console.log('Worker handle %s', job.data.filename);

      // [..., hostview_ver, device_id, year, month]
      var p = path.dirname(job.data.filename).split(path.sep);
      if (p.length < 5) {
        return done(new Error('Invalid filename: ' + job.data.filename));
      }

      // extract Hostview id and version from the filepath
      var device_id = p[p.length-3];
      var hv = p[p.length-4];

      // make sure the device is recorded in the db and get its id
      db.getOrInsertDevice(device_id, function(err, res) {
        if (err) return done(err);

        // add or update files table
        var file = {
          folder: path.dirname(job.data.filename),
          basename: path.basename(job.data.filename),
          status: 'processing',
          device_id: res.id,
          hostview_version: hv 
        };
        db.insertOrUpdate(file, function(err, res) {
          if (err) return done(err);

          // updates file status on error/success and signals the queue
          var processdone = function(err, res) {
            if (err) {
              file.status = 'error';
              file.error_info = err;        
            } else {
              file.status = 'success';
            }
            db.insertOrUpdate(file, function(err2, res2) {
              if (err) return done(err);
              done();
            });
          };

          try {
            // finally, process the file
            if (job.data.filename.indexOf('.db')>0) {
              process_sqlite.process(job.data.filename, db, processdone);
            } else if (job.data.filename.indexOf('.pcap')>0) {
              process_pcap.process(job.data.filename, db, processdone);
            } else {
              processdone(new Error('Unknown file: ' + job.data.filename));
            }
          } catch(err) {
            console.error('Unhandled worker error', err);   
            processdone(err);
          }

        }); // db.insertOrUpdate
      }); // db.getOrInsertDevice
    }); // queue.process
  }
})();