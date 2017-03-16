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
    this._db = pgb.configure(dburl);
};

// (FOR TESTING) THIS WILL EMPTY ALL TABLES, USE WITH CARE !!!
DB.prototype.clearall = function(cb) {
    var tables = ['activities','activity_io','browser_activity',
    'connections','device_info','dns_logs',
    'http_logs','io','locations','netlabels','pcap_events',
    'pcap_flow','pcap_rtt','pcap_throughput','ports',
    'power_states','processes','processes_running',
    'survey_problem_tags','survey_activity_tags','surveys',
    'video_buffered_play_time_sample','video_buffering_event',
    'video_off_screen_event','video_pause_event','video_playback_quality_sample',
    'video_player_size','video_resolution','video_seek_event',
    'video_session','wifi_stats',
    'users','sessions','pcap','pcap_file','files','devices'];

    this._db.transaction(function(client, callback) {
        var loop = function() {
            if (tables.length>0) {
                client.delete(tables.shift()).run(function(err,res) {
                    if (err) return callback(err); // stop on error
                    return loop(); // next table
                });
            } else {
                callback(null); // all done
            }
        }
        loop();
    }, cb);
}

//--- highlevel funcs ---

DB.prototype.insert = function(table, rowdata, cb) {
    if (!this._db) 
        return cb(new Error('No db connection [' + this.dburl + ']'));
    this._db.insert(table, rowdata).returning('*').row(cb);     
}

DB.prototype.update = function(table, newdata, filter, cb) {
    if (!this._db) 
        return cb(new Error('No db connection [' + this.dburl + ']'));
    this._db.update(table, newdata).where(filter).run(cb);     
}

DB.prototype.delete = function(table, filter, cb) {
    if (!this._db) 
        return cb(new Error('No db connection [' + this.dburl + ']'));
    this._db.delete(table).where(filter).run(cb);     
}

DB.prototype.select = function(table, filter, cb) {
    if (!this._db) 
        return cb(new Error('No db connection [' + this.dburl + ']'));
    if (filter)
        this._db.select('*').from(table).where(filter).rows(cb);     
    else
        this._db.select('*').from(table).rows(cb);     
}

DB.prototype.getOrInsert = function(table, row, cb) {
    if (!this._db) 
        return cb(new Error('No db connection [' + this.dburl + ']'));

    this._db.transaction(function(client, callback) {
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

DB.prototype.getOrInsertDevice = function(table, row, extra, cb) {
    if (!this._db)
        return cb(new Error('No db connection [' + this.dburl + ']'));

    this._db.transaction(function(client, callback) {
        async.waterfall([
            client.select('*').from(table).where(row).run,
            function(res, callback) {
                if (res.rows.length==0) {
                    var row2 = { device_id : row.device_id, user_id : extra};
                    client.insert(table, row2).returning('*').row(callback);
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
    if (!this._db) 
        return cb(new Error('No db connection [' + this.dburl + ']'));
    var that = this;

    this._db.transaction(function(client, callback) {

        var filter = { 
            device_id : file.device_id, 
            basename : file.basename
        };

        async.waterfall([
            client.select('*').from('files').where(filter).run,
            function(res, callback) {
                if (res.rows.length==1) {
                    var dbfile = res.rows[0];
                    if (dbfile.status === 'success') {
                        // file exists and has been processed already !!
                        callback(new Error('file already processed ' + dbfile.basename));
                    } else {                        
                        var update = {
                            updated_at : that._db.sql('now()'),
                            status : file.status
                        };
                        var idfilter = { id : dbfile.id };
                        client.update('files', update).where(idfilter).run(callback);
                    }
                } else {
                    client.insert('files', file).run(callback);
                }
            },
            function(res, callback) {
                client.select('*').from('files').where(filter).row(callback);
            }
        ], callback);

    }, function(err, res) {
        // called upon transaction success/failure
        if (err) return cb(err);
        cb(undefined, res);
    });
}

/** The DB API. */
module.exports.DB = DB;