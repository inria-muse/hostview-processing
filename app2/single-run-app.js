/**
 * Created by fbronzin on 16/03/2017.
 */

/**
 * app.js
 *
 * To start the processing cluster, run: `node app.js`.
 *
 */

var debug = require('debug')('hostview-single-time')
    //, cluster = require('cluster')
    , fs = require('fs-extra')
    , path = require('path')
    , chokidar = require('chokidar')
    , sqldb = require('../app/lib/sqldb')
    , process_sqlite = require('../app/lib/process_sqlite');


// Global configuration
var config = {
    data_dir: '',
    enable_watch: true,     // monitor incoming files ?
    retry: 3,                 // number of retries
    retry_delay: 3600,  // delay between retries (s)
    workers: 1,             // num worker threads
    concurrency: 5,     // num jobs / worker
    db: ''           // postgresql url (or use default)
};


// hostview raw files
var getFileType = function(path) {
    if (path.indexOf("stats.db") > 0) return 'sqlite';
    else if (path.indexOf(".pcap") > 0) return 'pcap';
    else if (path.indexOf(".json") > 0) return 'json';
    else return 'other';
};

var processNewFile = function (job) {
    // in a worker
    var db = new sqldb.DB(config.db);

    debug('Processing file %s', job.filename);

    //TODO make sure that this path is correct and is split properly
    // [..., device_id, hostview_ver, year, month]
    var p = path.dirname(job.filename).split(path.sep);
    if (p.length < 5) {
        debug('Worker: %d', process.pid ,' Invalid filepath: ' + job.filename);
        return done(new Error('Invalid filepath: ' + job.filename));
    }


    // extract Hostview id and version from the filepath
    var device_id = p[p.length-2];
    var user_id = p[p.length-1];
    var hv = '0.1';

    // make sure the device is recorded in the db and get its id
    //TODO insert into the device also the name of the user as by the path split
    db.getOrInsertDevice('devices', { device_id : device_id }, user_id, function(err, dev) {
        if (err) {
            debug('Worker: %d', process.pid ,' Error inserting the device ', device_id, ' into the DB: ', err);
            return done(err);
        } else {
            debug('Worker: %d', process.pid ,' Got/Inserted device');
        }

        // add or update files table
        var file = {
            folder: path.dirname(job.filename),
            basename: path.basename(job.filename),
            status: 'processing',
            device_id: dev.id,
            hostview_version: hv
        };
        debug('Worker: %d', process.pid ,' Processing: ', file);

        // this will return error if the file exists already in the database
        // and has been processed (status == 'success')
        db.insertOrUpdateFile(file, function(err, res) {
            if (err) {
                debug('Worker: %d', process.pid ,' Error inserting the file into the DB: ', err);
                return;
            } else {
                debug('Worker: %d', process.pid ,' Inserted/Updated file');
            }

            var processdone = function(err, res) {
                // updates file status to error/success and signals the queue that we're done
                if (err) {
                    debug('Worker: %d', process.pid ,' Process done but with an error: ', err);
                    file.status = 'errored';
                    file.error_info = err+"";
                } else {
                    debug('Worker: %d', process.pid ,' Completed processing: ', res);
                    file.status = 'success';
                }

                db.insertOrUpdateFile(file, function() {
                    // signal done with error (if any)
                    debug('Worker: %d', process.pid ,' Finished with file: ', file);
                });

            }; // processdone

            // for processing
            file.path = job.filename;

            try {

                // finally, process the file
                //INFO processing only the sqlite files
                if (job.filetype == 'sqlite') {
                    console.log('process_sqlite');
                    process_sqlite.process(file, db, processdone);

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
} // processing


//General environment check
try {
    // Ensure we're in the project directory, so relative paths work as expected
    // no matter where we actually run from.
    process.chdir(__dirname);

} catch (err) {
    console.error(err);
    process.exit(1);
}



// the incoming files monitor
var monitor = undefined;

// master thread
debug('Starting the master process ... stop with Ctrl^C');
debug(JSON.stringify(config,null,2));

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, closing the workers ...');

    if (monitor) monitor.close();
    monitor = undefined;
});

var enqueue = function(path) {
    var task = { filename : path, filetype : getFileType(path) };
    debug('Master: ', JSON.stringify(task,null,2));
    processNewFile(task);
};

// this will first scan the incoming folder and then start
// watching for new files (or just waits for the processing to finish
// if watcher is disabled)
monitor = chokidar.watch(config.data_dir, {
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
    });
} // else keep on watching for new files
else {
    debug('Watching folder ', config.data_dir);
}