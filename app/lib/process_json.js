/**
 * process_json.js
 */

module.exports.process = function(file, db, cb) {
    if (!file || !db)
        return cb(new Error('missing arguments'));

    // jsons will end up to the failed folder after x retries with this error
    return cb(new Error('Not implemented'));
}