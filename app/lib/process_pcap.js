/**
 * process_pcap.js
 */
 var debug = require('debug')('hostview')
    , path = require('path')
    , fs = require('fs-extra')
    , async = require('async')
    , glob = require('glob')
    , child_process = require('child_process')
    , utils = require('./utils');


var getinfo = function(p) {
    var base = path.basename(p)

    var info = base.replace('.pcap.zip','').split('_');
    if (info.length != 5) return undefined;

    return {
        basename : base,
        session_ts : parseInt(info[0]),
        conn_ts : parseInt(info[1]),
        filenum : parseInt(info[2]),
        adapter : info[3],
        part : info[4],
        islast : (info[4]==='last')
    }
};

/** Process single (merged) pcap file. */
var pcapprocess = module.exports.pcapprocess = function(mergedfile, db, cb) {
    if (!mergedfile || !db)
        return cb(new Error('[process_pcap] missing arguments'));

    // call the python script
};

/** Process raw partial pcaps from Hostview. */
module.exports.process = function(file, db, config, cb) {
    if (!file || !db || !config)
        return cb(new Error('[process_pcap] missing arguments'));

    // file.path == /**/sessionstarttime_connectionstarttime_filenum_adapterid_[part|last].pcap.zip
    var finfo = getinfo(file.path);
    debug('prosess pcap', finfo);
    if (!finfo) return cb(new Error("[process_pcap] invalid filename: " + file.path));

    // copy the file to the pcap folder for processing
    try {
        var dst = config.pcap_dir + '/' + file.device_id + '/' + file.basename;
        debug('copy ' + file.path + ' to ' + dst);
        fs.copySync(file.path, dst);
    } catch (err) {
        return cb(err);
    }

    // check if we've got the last + all parts for this capture session
    var p = config.pcap_dir + '/' + file.device_id + '/' +finfo.session_ts+"_"+finfo.conn_ts+"_*_"+finfo.adapter+"_*.pcap.zip";
    debug('glob',p);

    glob(p, function(err, files) {
        if (err) return cb(err);

        var lastfilenum = -1;
        var fileinfos = [];
        var intransaction = false;

        files.forEach(function(item) {
            var finfo = getinfo(item);
            if (finfo.islast)
                lastfilenum = finfo.filenum;
            fileinfos.push(finfo);
        });

        debug('lastfilenum ' + lastfilenum, fileinfos);

        if (lastfilenum<0 || fileinfos.length < lastfilenum+1)
            return cb(null); // missing parts, just signal this part handled for now

        // all parts available - merge and process to the db
        var mergedfile = '/tmp/'+file.device_id+"/"+finfo.session_ts+"_"+finfo.conn_ts+"_"+finfo.adapter+".pcap.gz";
        debug('handle complete pcap ' + mergedfile);

        async.waterfall([
            function(callback) {
                // uncompress all partial pcaps to a tmp location
                callback(null, p, '/tmp/'+file.device_id);
            },

            utils.uncompress2,

            function(callback) {
                if (fileinfos.length > 1) {
                    // combine all parts into a single pcap file
                    var cmd = "tracemerge pcapfile:"+mergedfile+" " + files.join(' ');
                    debug('merge',cmd);
                    child_process.exec(
                        cmd,
                        function(err, stdout, stderr) {
                            debug(err, stdout, stderr);
                            if (err) return callback(err);
                            return callback(null);
                        }
                    );
                } else {
                    // nothing to merge
                    debug('move ' + files[0] + ' to ' + mergedfile);
                    fs.move(files[0], mergedfile, callback);
                }
            },

            function(callback) {
                db._db.raw('BEGIN;', []).run(function(err, res) {
                    intransaction = !err;
                    callback(err);
                });
            },

            function(callback) {
                debug('pcap');
                var isql = `INSERT INTO pcap(
                    connection_id,
                    status,
                    folder,
                    basename)
                    SELECT c.id, $1, $2, $3
                    FROM connections c WHERE c.started_at = $4;`;

                var params = [
                    'processing', 
                    file.folder,
                    path.basename(mergedfile),
                    new Date(finfo.conn_ts)
                ];

                debug('insert', params);
                db._db.raw(isql, params).run(function(err, res) {
                    callback(err);
                });
            }, 

            function(callback) {
                debug('pcap_file');

                var isql = `INSERT INTO pcap_file(
                    pcap_id,
                    file_id,
                    file_order)
                    SELECT p.id, $1, $2
                    FROM pcap p WHERE p.basename = $3;`;  

                var loop = function() {
                    if (fileinfos.length == 0)
                        return callback(null);                    
                    var item = fileinfos.shift();

                    // find the file info
                    db._db.select('*')
                        .from('files')
                        .where({ 
                            device_id: file.device_id, 
                            basename: item.basename 
                        })
                        .row(function(err, row) {
                            if (err) return callback(err);

                            var params = [
                                row.id,
                                item.filenum,
                                path.basename(mergedfile)
                            ];
                            debug('insert', params);
                            db._db.raw(isql, params).run(function(err, res) {
                                if (err) return callback(err);
                                process.nextTick(loop);
                            }); 
                        }); // select
                };
                loop();
            },

            /*
            function(callback) {
                // process the combined trace and insert data to the db
                pcapprocess(mergedfile, db, callback);
            },
            */

            function(callback) {
                // move the combined trace to processed_dir
                try {
                    var dst = config.processed_dir+'/'+file.folder+'/'+path.basename(mergedfile);
                    debug('move ' + mergedfile + ' to ' + dst);
                    fs.moveSync(mergedfile, dst);
                } catch (err) {
                }
                callback(null);
            },

            function(callback) {
                // remove the partial files (copy is already in processed_dir)
                try {
                    files.forEach(function(item) {
                        debug('remove ' + item);
                        fs.unlinkSync(item);
                    });
                } catch (err) {
                }
                callback(null);
            }
        ], 
        function(err) {
            debug('done, transaction active ' + intransaction, err);

            var tmp = function() {
                // make sure we dont' leave stuff at tmp
                var p = '/tmp/'+file.device_id+'/'+finfo.session_ts+"_"+finfo.conn_ts+"*"+finfo.adapter+'*pcap*';
                glob(p, function(err2, files) {
                    if (!err2) {
                        try {
                            files.forEach(function(item) {
                                debug('remove ' + item);
                                fs.unlinkSync(item);
                            });
                        } catch (err) {
                        }
                    }

                    // return pcap handling success/failure to the caller
                    return cb(err);                
                });
            };

            if (intransaction) {
                if (err)
                    db._db.raw('ROLLBACK;', []).run(tmp);
                else
                    db._db.raw('COMMIT;', []).run(tmp);                    
            } else {
                tmp();
            }


        }); // waterfall
    }); // glob
}