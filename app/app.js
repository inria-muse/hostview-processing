/**
 * app.js
 *
 * To start the processing cluster, run: `node app.js`.
 *
 */

var kue = require('kue')
  , debug = require('debug')('hostview')
  , cluster = require('cluster')
  , fs = require('fs-extra')
  , path = require('path')
  , chokidar = require('chokidar')
  , sqldb = require('./lib/sqldb')
  , process_sqlite = require('./lib/process_sqlite')
  , process_pcap = require('./lib/process_pcap')
  , process_json = require('./lib/process_json');


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

  // hostview raw files
  var getFileType = function(path) {
    if (path.indexOf("stats.db") > 0) return 'sqlite';
    else if (path.indexOf(".pcap") > 0) return 'pcap';
    else if (path.indexOf(".json") > 0) return 'json';
    else return 'other';
  };  

  // Global configuration
  var datadir = process.env.PROCESS_DATA_DIR||'/tmp';
  var config = {
    data_dir: datadir,
    incoming_dir: datadir+'/incoming',                // incoming files
    processed_dir: datadir+'/processed',              // processed files
    failed_dir: datadir+'/failed',                    // failed files
    pcap_dir: datadir+'/pcapparts',                   // partial pcap files
    enable_watch: getbool('PROCESS_WATCH',false),     // monitor incoming files ?
    retry: getint('PROCESS_RETRY',3),                 // number of retries
    retry_delay: getint('PROCESS_RETRY_DELAY',3600),  // delay between retries (s)
    workers: getint('PROCESS_WORKERS',1),             // num worker threads
    concurrency: getint('PROCESS_CONCURRENCY',5),     // num jobs / worker
    redis: process.env.PROCESS_REDIS||undefined,      // redis url (or use default)
    db: process.env.PROCESS_DB||undefined             // postgresql url (or use default)
  };

  try {
    // Ensure we're in the project directory, so relative paths work as expected
    // no matter where we actually run from.
    process.chdir(__dirname);

    // Ensure all target dirs are available
    fs.ensureDirSync(config.incoming_dir);
    fs.ensureDirSync(config.processed_dir);
    fs.ensureDirSync(config.failed_dir);
    fs.ensureDirSync(config.pcap_dir);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  // the processing task queue
  var queue = kue.createQueue({redis : config.redis});

  if (cluster.isMaster) {

    // the incoming files monitor
    var monitor = undefined;

    // master thread 
    console.log('Starting the master process ... stop with Ctrl^C');
    debug(JSON.stringify(config,null,2));

    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, closing the workers ...');

      if (monitor) monitor.close();
      monitor = undefined;

      queue.shutdown(5000, function(err) {
        debug( 'Shutdown: ', err||'' );
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
    queue.on('job failed', function(id, message) {
      console.error('Job #%d failed %s',  id, message);

      kue.Job.get(id, function(err, job){
        if (err) return console.error(err);

        job.remove(function(err){
          if (err) return console.error(err);
          debug('Removed job #%d', job.id);
        });

        // move the file to the failed folder
        var dst = job.data.filename.replace(config.incoming_dir, config.failed_dir);
        fs.move(job.data.filename, dst, function (err) {
          if (err) return console.error(err)
          debug('File stored as %s', dst);
        });

      });

    }).on('job complete', function(id, result) {
      console.log('Job #%d completed %s',  id, result);

      kue.Job.get(id, function(err, job){
        if (err) return console.error(err);

        job.remove(function(err){
          if (err) return console.error(err);
          debug('Removed job #%d', job.id);
        });

        // move the file to the processed folder
        var dst = job.data.filename.replace(config.incoming_dir, config.processed_dir);
        fs.move(job.data.filename, dst, function (err) {
          if (err) return console.error(err)
          debug('File stored as %s', dst);
        });

      });

    });

    var enqueue = function(path) {
      var task = { filename : path, filetype : getFileType(path) };
      debug(JSON.stringify(task,null,2));

      var prio = 'normal';
      if (task.filetype == 'sqlite') {
        prio = 'critical'; // so that sessions get added asap
      } else if (task.filetype == 'pcap') {
        prio = 'low';
      }

      queue.create('incoming', task)
        .attempts(config.retry)
        .backoff( {delay: config.retry_delay*1000, type:'fixed'} )
        .priority(prio)
        .save(function(err) {
          if (err) {
            console.error('Failed to create job', err);
          }
        });
    };

    // this will first scan the incoming folder and then start
    // watching for new files (or just waits for the processing to finish
    // if watcher is disabled)
    monitor = chokidar.watch(config.incoming_dir, {
      persistent: config.enable_watch,
      alwaysStat: true
    });

    monitor.on('add', function(path, stats) {
      if (stats && stats.isFile()) {
        enqueue(path);
      }
    });

    if (!config.enable_watch) {
      // wait for all the jobs to be processed and exit
      monitor.on('ready', function() {
        monitor.close();
        monitor = undefined;

        console.log('Master waiting for the workers to finish ... ');
        queue.shutdown(function() {
          console.log('Master shutting down!');
          process.exit(0);
        });
      });
    } // else keep on watching for new files

  } else {
    // in a worker
    var db = new sqldb.DB(config.db);

    queue.process('incoming', config.concurrency, function(job, done) {
      console.log('Worker handle %s', job.data.filename);

      // [..., device_id, hostview_ver, year, month]
      var p = path.dirname(job.data.filename).split(path.sep);
      if (p.length < 5) {
        return done(new Error('Invalid filepath: ' + job.data.filename));
      }

      // extract Hostview id and version from the filepath
      var device_id = p[p.length-4];
      var hv = p[p.length-3];

      // make sure the device is recorded in the db and get its id
      db.getOrInsert('devices', { device_id : device_id }, function(err, dev) {
        if (err) return done(err);

        // add or update files table
        var file = {
          folder: path.dirname(job.data.filename).replace(config.incoming,''),
          basename: path.basename(job.data.filename),
          status: 'processing',
          device_id: dev.id,
          hostview_version: hv 
        };        
        debug('processing',file);

        // this will return error if the file exists already in the database
        // and has been processed (status == 'success')
        db.insertOrUpdateFile(file, function(err, res) {
          if (err) return done(err);

          var processdone = function(err, res) {
            // updates file status to error/success and signals the queue that we're done
            if (err) {
              file.status = 'errored';
              file.error_info = err+"";
            } else {
              file.status = 'success';
            }

            db.insertOrUpdateFile(file, function() {
              // signal done with error (if any)
              done(err);
            });

          }; // processdone

          // for processing
          file.path = job.data.filename;

          try {

            // finally, process the file
            if (job.data.filetype == 'sqlite') {
              console.log('process_sqlite');
              process_sqlite.process(file, db, processdone);

            } else if (job.data.filetype == 'pcap') {
              console.log('process_pcap');
              process_pcap.process(file, db, config, processdone);

            } else if (job.data.filetype == 'json') {
              console.log('process_json');
              process_json.process(file, db, processdone);

            } else {
              // 'other', just signal success (gets moved to the processed folder)
              console.log('process_dummy');
              processdone(null);

            }

          } catch(err) {
            console.error('Unhandled worker error', err);   
            processdone(err);
          }

        }); // db.insertOrUpdate
      }); // db.getOrInsertDevice
    }); // queue.process
  } // worker
})();