/**
 * process_pcap.js
 */
 var debug = require('debug')('hostview')
    , path = require('path')
    , fs = require('fs-extra')
    , async = require('async')
    , glob = require('glob')
    , child_process = require('child_process');


var getinfo = function(p) {
    var base = path.basename(p, '.pcap.zip')
    var info = p.split('_');

    if (info.length != 5) return undefined;

    return {
        session_ts : parseInt(info[0]),
        conn_ts : parseInt(info[1]),
        filenum : parseInt(info[2]),
        adapter : info[3],
        part : info[4],
        islast : (info[4]==='last')
    }
};

/** Process single (merged) pcap file. */
var pcapprocess = module.exports.pcapprocess = function(mergedfile, db, config, cb) {
    // call the python script
};

/** Process raw partial pcaps from Hostview. */
module.exports.process = function(file, db, config, cb) {
    if (!file || !db || !config)
        return cb(new Error('[process_pcap] missing arguments'));

    // file.path == /**/sessionstarttime_connectionstarttime_filenum_adapterid_[part|last].pcap.zip
    var finfo = getinfo(file.path);
    if (!finfo) return cb(new Error("[process_pcap] invalid filename: " + file.path));

    // copy the file to the pcap folder for processing
    try {
        fs.copySync(file.path, config.pcap_dir + '/' + file.device_id + '/' + file.basename);
    } catch (err) {
        return cb(err);
    }

    // check if we've got the last + all parts for this capture session
    var p = config.pcap_dir + '/' + file.device_id + '/' +finfo.session_ts+"_"+finfo.conn_ts+"_*_"+finfo.adapter+"_*.pcap.zip";
    debug('glob',p);

    glob(p, function(err, files) {
        if (err) return cb(err);

        var lastfilenum = -1;
        var filenums = [];

        files.forEach(function(item) {
            var finfo = getinfo(item);
            if (finfo.islast)
                lastfilenum = finfo.filenum;
            filenums.push(finfo.filenum);            
        });

        debug('lastfilenum ' + lastfilenum, filenums);
        if (lastfilenum<0 || filenums.length < lastfilenum+1)
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
                var cmd = "tracemerge pcapfile:"+mergedfile+" " + files.join(' ');
                debug(cmd);

                child_process.exec(
                    cmd,
                    function(err, stdout, stderr) {
                        if (err) return callback(err);
                        return callback(null);
                    }
                );                     
            },

            function(callback) {
                // add pcap row
            }, 

            function(callback) {
                // add pcap_files rows
            }, 

            function(callback) {
                // process the combined trace and insert data to the db
                pcapprocess(mergedfile, db, config, callback);
            },

            function(callback) {
                // move the combined trace to processed_dir
                try {
                    var dst = config.processed_dir+'/'+file.folder+'/'+path.basename(mergedfile);
                    fs.moveSync(mergedfile, dst);
                } catch (err) {
                }
                callback(null);
            },

            function(callback) {
                // remove the partial files (copy is already in processed_dir)
                try {
                    files.forEach(function(item) {
                        fs.unlinkSync(item);
                    });
                } catch (err) {
                }
                callback(null);
            }
        ], 
        function(err) {
            // make sure we never leave stuff at tmp
            glob('/tmp/'+file.device_id+'/'+finfo.session_ts+"_"+finfo.conn_ts+"*"+finfo.adapter+'*pcap*', function(err2, files) {
                if (!err2) {
                    try {
                        files.forEach(function(item) {
                            fs.unlinkSync(item);
                        });
                    } catch (err) {
                    }
                }
                // return pcap handling success/failure
                return cb(err);
            });
        }); // waterfall
    }); // glob
}