/**
 * process_pcap.js
 *
 * Process a pcap file. In this app we just check if we have received a complete
 * file (last + all parts if any), merge and move to the pcap processing folder.
 *
 * The pcap processing is done by a separate python app.
 */
 var path = require('path')
    ,glob = require("glob");


var getinfo = function(p) {
    var base = path.basename(p, '.pcap.zip')
    var info = p.split('_');

    if (info.length != 5)
        return undefined;

    return {
        session_ts : parseInt(info[0]),
        conn_ts : parseInt(info[1]),
        filenum : parseInt(info[2]),
        adapter : info[3],
        part : info[4],
        islast : (info[4]==='last')
    }
};

module.exports.process = function(file, db, dstdir, callback) {
    if (!file || !db || !dstdir)
        return cb(new Error('[process_pcap] missing arguments'));

    // file.path == ../sessionstarttime_connectionstarttime_filenum_adapterid_[part|last].pcap.zip
    var finfo = getinfo(file.path);
    if (!finfo)
        return callback(new Error("[process_pcap] invalid filename: " + file.path));

    // check if we've got the last + all parts for this capture session
    var lastfilenum = -1;
    var filenums = [];

    var p = file.folder+"/"+finfo.session_ts+"_"+finfo.conn_ts+"_*_"+finfo.adapter+"_*.pcap.zip";

    glob(p, function(err, files) {
        if (err) return callback(err);

        for (var i = 0; i < files.length; i++) {
            var finfo = getinfo(files[i]);
            if (finfo.islast)
                lastfilenum = finfo.filenum;
            filenums.push(finfo.filenum);
        }

        if (lastfilenum>=0 && filenums.length == lastfilenum+1) {
            // we have all parts!

            // uncompress files to a tmp location

            // call tracemerge 

            // process the combined trace and insert data to the db

            // move the combined trace to dstdir

            // cleanup tmp files


        } else {
            // missing parts, don't return an error though, we will try again
            // next time when a new part arrives
            callback(null, false);    
        }
    });
}