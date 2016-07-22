/**
 * process_json.js
 */

module.exports.process = function(file, db, cb) {
    if (!file || !db)
        return cb(new Error('missing arguments'));

    return cb(new Error('TODO'));
}