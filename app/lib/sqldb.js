/**
 * sqldb.js
 *
 * DB interface.
 */
var pg = require('pg-bricks');

var DB = function(dburl) {
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
    this.db.update(table, newdata).where(filter).run(cb);     
}

DB.prototype.select = function(table, filter, cb) {
    if (!this.db) 
        return cb(new Error('No db connection [' + this.dburl + ']'));
    this.db.select('*').from(table).where(filter).rows(cb);     
}


DB.prototype.getOrInsertDevice = function(devid, cb) {
    var that = this;
    var dev = { device_id : devid };
    that.select('devices', dev, function(err, rows) {
        if (err) return cb(err);
        if (rows && rows.length == 1) {
            dev = rows[0];
            dev.existed = true;
            cb(undefined, dev);
        } else {
            that.insert('devices', dev, cb);
        }
    });
}

DB.prototype.insertOrUpdateFile = function(file, cb) {
    var that = this;
    that.select('files', { 
            device_id : file.device_id, 
            basename : file.basename
        }, 
        function(err,rows) {
            if (err) return cb(err);

            if (rows && rows.length == 1) {
                that.update('files', {
                    updated_at : that.db.sql('now()'),
                    status : file.status
                }, { id : rows[0].id }, function(err, res) {
                    var f = rows[0];
                    f.status = file.status;
                    f.updated_at = new Date();
                    cb(err, f);
                });
            } else {
                that.insert('files', file, cb);
            }
        });
}

/** The DB API. */
module.exports.DB = DB;