/**
 * sqldb.js
 *
 * DB interface.
 */
var pgb = require('pg-bricks')
    , async = require('async');

/** Constructor */
var DB = function(dburl) {
    this.dburl = dburl;
    this.db = pgb.configure(dburl);
};

// note the caller func receives pg-bricks client
DB.prototype.transaction =  function(func, cb) {
    if (!this.db) 
        return cb(new Error('No db connection [' + this.dburl + ']'));

    this.db.transaction(function(client, callback) {
        func(client, function () {
            results = arguments;
            callback.apply(null, arguments);
        });
    }, cb);
};

//--- highlevel funcs ---

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

DB.prototype.getOrInsert = function(table, row, cb) {
    if (!this.db) 
        return cb(new Error('No db connection [' + this.dburl + ']'));

    this.db.transaction(function(client, callback) {
        async.waterfall([
            client.select('*').from(table).where(row).run,
            function(res, callback) {
                if (res.rows.length==0) {
                    client.insert(table, row).returning('*').row(callback);
                } else {
                    row.id = res.rows[0].id;
                    callback(undefined, row);
                }
            }
        ], callback);
    }, function(err, res) {
        // called upon transaction success/failure
        if (err) return cb(err);
        cb(undefined, res);           
    });
};

DB.prototype.insertOrUpdateFile = function(file, cb) {
    if (!this.db) 
        return cb(new Error('No db connection [' + this.dburl + ']'));

    this.db.transaction(function(client, callback) {

        var filter = { 
            device_id : file.device_id, 
            basename : file.basename
        };

        async.waterfall([
            client.select('*').from('files').where(filter).run,
            function(res, callback) {
                if (res.rows.length==1) {
                    var update = {
                        updated_at : that.db.sql('now()'),
                        status : file.status
                    };
                    var idfilter = { id : rows[0].id };
                    client.update('files', update).where(idfilter).run(callback);
                } else {
                    client.insert('files', file).returning('*').row(callback);                    
                }
            },
            function(res, callback) {
                if (res) {
                    // from insert
                    callback(undefined, res);
                } else {
                    // from update
                    file.updated_at = new Date();
                    callback(undefined, file);
                }
            }
        ], callback);
    }, function(err, res) {
        // called upon transaction success/failure
        if (err) return cb(err, file);
        cb(undefined, res);           
    });
}

/** The DB API. */
module.exports.DB = DB;