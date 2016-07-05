/**
 * utils.js
 *
 * Common helper functions.
 */
var fs = require('fs-extra')
    , child_process = require('child_process'),
    , path = require("path");

/** 
 * Uncompress the given src archive file to dst folder. 
 *
 * Returns the name of the uncomressed file (caller is responsible 
 * for cleaning it up eventually). 
 */
module.exports.uncompress = function(src, dst, cb) {
    try {
        fs.ensureDirSync(dst);

        child_process.exec(
            "dtrx -q -n -f " + src,
            { cwd: dst },
            function(err, stdout, stderr) {
                if (err) return cb(error);
                return cb(undefined, path.join[dst,path.basename(src)]);
            });

    } catch (err) {
        cb(err, undefined);
    }        
}