/**
 * sqldb.js
 *
 * DB interface.
 */
var pg = require('pg-bricks');

var DB = module.exports.DB = function(dburl) {
    this.dburl = dburl;
    this.db = pg.configure(dburl);
}

DB.prototype.insert = function(table, rowdata, cb) {
    if (!this.db) 
        return cb(new Error('No db connection [' + this.dburl + ']'));
    this.db.insert(table, rowdata).returning('*').row(cb);     
}

DB.prototype.update = function(table, newdata, filter, cb) {
    if (!this.db) 
        return cb(new Error('No db connection [' + this.dburl + ']'));
    this.db.update(table, rowdata).where(filter).run(cb);     
}

DB.prototype.select = function(table, filter, cb) {
    if (!this.db) 
        return cb(new Error('No db connection [' + this.dburl + ']'));
    this.db.select('*').from(table).where(filter).run(cb);     
}


DB.prototype.getOrInsertDevice = function(devid, cb) {
    var dev = { device_id : devid };
    this.select('devices', dev, function(err, query_result) {
        if (err) return cb(err);
        if (query_result && query_result.rows.length == 1) {
            cb(undefined, query_result.rows[0]);
        } else {
            this.insert('devices', dev, cb);
        }
    });
}

DB.prototype.insertOrUpdateFile = function(file, cb) {
    this.select('files', { 
        device_id : file.device_id, 
        basename : file.basename
    }, 
    function(err, query_result) {
        if (err) return cb(err);

        if (query_result && query_result.rows.length == 1) {
            this.update('files', {
                updated_at : this.db.sql('now()'),
                status : file.status
            }, { id : query_result.rows[0].id }, cb);
        } else {
            this.insert('files', file, cb);
        }
    });
}
