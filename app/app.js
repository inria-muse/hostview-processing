/**
 * app.js
 *
 * To start the processing cluster, run: `node app.js`.
 *
 */

var kue = require('kue')
  , cluster = require('cluster')
  , fs = require('fs-extra')
  , watch = require('watch')
  , process_sqlite = require('./lib/process_sqlite')
  , process_pcap = require('./lib/process_pcap');


(function() {

  // return boolean environment value or default if not defined
  var getbool = function(key, defaultv) {
    var string = process.env[key] || '';  
    switch (string.toLowerCase().trim()) {
      case "true": case "yes": case "1": return true;
      case "false": case "no": case "0": case null: return false;
      default: defaultv;
    }
  }

  // return integer environment value or default if not defined
  var getint = function(key, defaultv) {
    var string = process.env[key];  
    if (string) {
      var v = parseInt(string.trim());
      if (!isNan(v)) return v;
    }
    return defaultv;
  }

  // Global configuration. TODO: add postgresql
  var config = {
    enable_watch: getbool(process.env.PROCESS_WATCH,false),   // monitor incoming files ?
    incoming_dir: (process.env.PROCESS_DATA_DIR||'/tmp')+'/incoming',   // incoming files
    processed_dir: (process.env.PROCESS_DATA_DIR||'/tmp')+'/processed', // processed files
    failed_dir: (process.env.PROCESS_DATA_DIR||'/tmp')+'/failed',       // failed files
    retry: getint(process.env.PROCESS_RETRY,3),               // number of retries
    workers: getint(process.env.PROCESS_WORKERS,1),           // num worker threads
    concurrency: getint(process.env.PROCESS_CONCURRENCY,5),   // num jobs / worker
    redis: process.env.REDIS_PORT || undefined                // redis URL (or use default)
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

    process.once('SIGINT', () => {
      console.log('Received SIGINT, closing the workers ...');

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
    queue.on('job failed', function(id, message) {
      console.error('Job #%d failed %s',  id, message);

      kue.Job.get(id, function(err, job){
        if (err) return console.error(err);

        job.remove(function(err){
          if (err) return console.error(err);
          console.log('Removed job #%d', job.id);
        });

        // move the file to the failed folder
        var dst = job.filename.replace(config.incoming_dir, config.failed_dir);
        fs.move(job.filename, dst, function (err) {
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
        var dst = job.filename.replace(config.incoming_dir, config.processed_dir);
        fs.move(job.filename, dst, function (err) {
          if (err) return console.error(err)
          console.log('File stored as %s', dst);
        });
      });

    });

    var enqueue = function(path) {
      var job = {
        filename : path,
        filetype : (path.endsWith('pcap.zip') ? 'pcap' : 'sqlite')
      }

      queue.create('incoming', job)
        .attempts(config.retry)
        .save(function(err) {
          if (!err) console.log('New job #%d [%s]', job.id, path);
        });
    }

    // scan incoming for any non-processed files
    fs.walk(config.incoming_dir)
      .on('data', function(path, stats) {
        if (stats.isFile()) enqueue(path);
      })
      .on('end', function () {
        if (config.enable_watch) {
          // start a watcher for new incoming files - the monitor will keep the master process alive
          watch.createMonitor(config.incoming_dir, function(m) {
            monitor = m;
            monitor.on("created", function(path, stats) {
              if (stats.isFile()) enqueue(path);
            });
          });
        } else {
          // wait for all the jobs to be processed and exit
          queue.shutdown(function() {
            process.exit(0);
          });
        }
      });

  } else {
    // the workers keep processing jobs from the queue
    queue.process('incoming', config.concurrency, function(job, done) {      
      console.log('Worker handle %s [%s]', job.data.filetype, job.data.filename);

      try {
        // dispatch the job to the handler
        if (job.data.filetype == 'sqlite') {
          process_sqlite.process(job.data.filename, done);
        } else if (job.data.filetype == 'pcap') {
          process_pcap.process(job.data.filename, done);
        } else {
          done(new Error('Unknown job type: ' + job.data.filetype));
        }

      } catch(err) {
        console.error('Unhandled worker error', err);   
        done(err);
      }

    });
  }
})();
