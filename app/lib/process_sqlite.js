/**
 * process_sqlite.js
 */
var fs = require('fs-extra')
    , utils = require('./utils')
    , async = require('async')
    , sqlite = require('sqlite3');

/** 
 *  Process a single sqlite file from Hostview.
 *
 *  We assume that each sqlite file corresponds to a 'session' and
 *  all that all raw data related to this session is in this sqlite file.
 */
module.exports.process = function(file, db, cb) {
    if (!file || !db)
        return cb(new Error('missing arguments'));

    // wrap everything in a transaction on the backend db --
    // any failure to write there will cancel the file processing
    // anc call cb with error

    db.transaction(function(client, callback)) {
        // the session of this file
        var session = {
            id = null,
            file_id: file.id,
            device_id: file.device_id,
            started_at: null,
            ended_at: null,
            start_event: null,
            stop_event: null          
        };

        // helper func to refactor out the common processing pattern
        // (read rows from sqlite and insert to the backend fb)
        var readloop = function(sql, dsttable, dstrow, callback) {
            var e = null;

            // fetch data from the sqlite
            file.db.each(sql, function(err, row) {
                if (err) { 
                    // we can't abort the .each(), so just record the error
                    // -- alternative is to do .all() but .each avoids reading
                    // all the data in memory (some tables can be huge !!)
                    e = e||err; 
                    return;
                }

                // map from sqlite row to backend db row
                var o = dstrow(row); 

                // track the latest data row (for when end event is missing)
                if (o.logged_at)
                    session.ended_at = utils.datemax(session.ended_at,o.logged_at);

                // add to the backend table
                client.insert(dsttable, o).run(function(err) { e = e||err; });

            }, function(err) {
                // .each() completed - pass on any error (or nothing on success)
                e = e||err;
                callback(e);
            });            
        };

        // the processing goes as follows:
        //
        //   1) uncompress the file to a temp location
        //   2) open sqlite connection to the temp file
        //   3) create the session on the backend db
        //   4) bulk of the work: map sqlite tables to backend db
        //   5) process other derived tables and data
        //   6) cleanup temp file

        // running the processing in series (there are parts that could
        // run in parallel I guess - TODO), if any of the steps fail,
        // the whole processing stops there and the transaction is rolled back

        async.waterfall([

            function(callback) {
                callback(null, file.path, '/tmp/'+file.device_id);
            },

            utils.uncompress,

            function(path, callback) {
                file.uncompressed_path = path;
                file.db = new sqlite.Database(path, sqlite3.OPEN_READONLY, callback);
            },

            function(callback) {
                // get session start event (there should only be one)
                sql=`SELECT timestamp started_at, event start_event
                    FROM session 
                    WHERE event IN ('start','restart','autorestart','resume','autostart')
                    ORDER BY timestamp ASC`;
                file.db.get(sql, callback);
            },

            function(row, callback) {
                // stop here - there's no start event so the db is (assumed?) empty
                if (!row) return callback(new Error('no data'));

                session.started_at = new Date(row.started_at);
                session.start_event = row.start_event;

                // get session end event (there should only be zero or one)
                sql=`SELECT timestamp ended_at, event end_event
                    FROM session 
                    WHERE event IN ('pause','stop','autostop','suspend')
                    ORDER BY timestamp DESC`;
                file.db.get(sql, callback);
            },

            function(row, callback) {
                if (row) {
                    session.ended_at = new Date(row.end_at);
                    session.end_event = row.end_event;
                } else {
                    // can happen if the hostview cli crashed
                    session.end_event = 'missing';
                    session.ended_at = session.started_at;
                }

                // store the session, returns the inserted row
                client.insert('sessions', session).returning('*').row(callback);
            },

            function(row, callback) {
                session.id = row.id;
                callback(null);
            },

            function(callback) {
                var sql=`SELECT * FROM wifistats ORDER BY timestamp ASC`;
                readloop(sql, 'wifi_stats', function(row) {
                    return {
                        session_id: session.id,
                        guid: row.guid,
                        t_speed: row.tspeed,
                        r_speed: row.rspeed,
                        signal: row.signal,
                        rssi: row.rssi,
                        state: row.state,
                        logged_at: new Date(row.timestamp)
                    };
                }, callback);
            },

            function(callback) {
                var sql=`SELECT * FROM procs ORDER BY timestamp ASC`;
                readloop(sql, 'processes', function(row) {
                    return {
                        session_id: session.id,
                        pid: row.pid,
                        name: row.name,
                        memory: row.memory,
                        cpu: row.cpu,
                        logged_at: new Date(row.timestamp)
                    };
                }, callback);
            },

            function(callback) {
                var sql=`SELECT * FROM powerstate ORDER BY timestamp ASC`;
                readloop(sql, 'power_states', function(row) {
                    return {
                        session_id: session.id,
                        event: row.event,
                        value: row.value,
                        logged_at: new Date(row.timestamp)
                    };
                }, callback);
            },

            function(callback) {
                var sql=`SELECT * FROM ports ORDER BY timestamp ASC`;
                readloop(sql, 'ports', function(row) {
                    return {
                        session_id: session.id,
                        pid: row.pid,
                        name: row.name,
                        protocol: row.protocol,
                        source_ip: row.srcip,
                        destination_ip: row.destip,
                        source_port: row.srcport,
                        destination_port: row.destport,
                        state: row.state,
                        logged_at: new Date(row.timestamp)
                    };
                }, callback);
            },

            function(callback) {
                var sql=`SELECT * FROM io ORDER BY timestamp ASC`;
                readloop(sql, 'io', function(row) {
                    return {
                        session_id: session.id,
                        device: row.device,
                        pid: row.pid,
                        name: row.name,
                        logged_at: new Date(row.timestamp)
                    };
                }, callback);
            },

            function(callback) {
                var sql=`SELECT * FROM sysinfo ORDER BY timestamp ASC`;
                readloop(sql, 'device_info', function(row) {
                    return {
                        session_id: session.id,
                        manufacturer: row.manufacturer,
                        product: row.product,
                        operating_system: row.os,
                        cpu: row.cpu,
                        memory_installed: row.totalRAM,
                        hdd_capacity: row.totalHDD,
                        serial_number: row.serial,
                        hostview_version: row.hostview_version,
                        settings_version: row.settings_version,
                        timezone: row.timezone,
                        timezone_offset: row.timezone_offset,
                        logged_at: new Date(row.timestamp)
                    };
                }, callback);
            },

            function(callback) {
                var sql=`SELECT * FROM netlabel ORDER BY timestamp ASC`;
                readloop(sql, 'netlabels', function(row) {
                    return {
                        session_id: session.id,
                        guid: row.guid,
                        gateway: row.gateway,
                        label: row.label,
                        logged_at: new Date(row.timestamp)
                    };
                }, callback);
            },

            function(callback) {
                var sql=`SELECT * FROM browseractivity ORDER BY timestamp ASC`;
                readloop(sql, 'browser_activity', function(row) {
                    return {
                        session_id: session.id,
                        browser: row.browser,
                        location: row.location,
                        logged_at: new Date(row.timestamp)
                    };
                }, callback);
            },

            function(callback) {
                // reading one ahead so we can log the finish as well
                var prev = undefined;

                var e = null;
                var sql=`SELECT * FROM activity ORDER BY timestamp ASC`;
                file.db.each(sql, function(err, row) {
                    if (err) { 
                        e = e||err; 
                        return; 
                    };

                    var o = {
                        session_id: session.id,
                        user_name: row.user,
                        pid: row.pid,
                        name: row.name,
                        description: row.description,
                        fullscreen: row.fullscreen,
                        idle: row.idle,
                        logged_at: new Date(row.timestamp)
                    };

                    if (prev) {
                        // ends when the new event happens
                        prev.finished_at = o.logged_at;
                        client.insert('activities', prev).run(function(err) {
                            e = e||err;
                            prev = o;
                        });
                    }
                }, function(err) {
                    // .each complete
                    e = e||err;
                    if (e) return callback(e); // something failed during .each

                    if (prev) {
                        // insert the last activity event
                        prev.finished_at = session.ended_at;
                        client.insert('activities', prev).run(callback);
                    } else {
                        callback(null);
                    }
                });
            },

            function(callback) {
                var e = null;
                var sql=`SELECT 
                            a.*,
                            l.public_ip,
                            l.reverse_dns,
                            l.asnumber,
                            l.asname,
                            l.countryCode,
                            l.city,
                            l.lat,
                            l.lon,
                            l.connstart l_timestamp,
                            a.timestamp started_at,
                            MIN(b.timestamp) ended_at 
                        FROM connectivity a
                        LEFT JOIN connectivity b
                            ON a.mac = b.mac
                            AND b.connected = 0
                            AND a.timestamp <= b.timestamp
                        LEFT JOIN location l 
                            ON a.timestamp = l.connstart
                        WHERE a.connected = 1
                        GROUP BY a.timestamp
                        ORDER BY a.mac ASC, started_at ASC`;

                file.db.each(sql, function(err, row) {
                    if (err) { 
                        e = e||err; 
                        return; 
                    };

                    var doconn = function(lid) {
                        var o = {
                            session_id: session.id,
                            location_id: lid,
                            started_at: new Date(row.started_at),
                            ended_at: (row.ended_at ? new Date(row.ended_at) : session.ended_at),
                            guid: row.guid,
                            friendly_name: row.friendlyname,
                            description: row.description,
                            dns_suffix: row.dnssuffix,
                            mac: row.mac,
                            ips: row.ips.split(','),
                            gateways: row.gateways.split(','),
                            dnses: row.dnses.split(','),
                            t_speed: row.tspeed,
                            r_speed: row.rspeed,
                            wireless: row.wireless,
                            profile: row.profile,
                            ssid: row.ssid,
                            bssid: row.bssid,
                            bssid_type: row.bssidtype,
                            phy_type: row.phytype,
                            phy_index: row.phyindex,
                            channel: row.channel
                        };
                        client.insert('connections', prev).run(function(err) {
                            e = e||err;
                        });
                    };

                    if (row.public_ip) {
                        // insert/get the location first
                        var l = {
                            public_ip: row.public_ip.trim(),
                            reverse_dns: row.reverse_dns.trim(),
                            asn_number: row.asnumber.trim(),
                            asn_name: row.asname.trim(),
                            country_code: row.countryCode.trim(),
                            city: row.city.trim(),
                            latitude: row.lat.trim(),
                            longitude: row.lon.trim()          
                        };

                        db.getOrInsert('locations', l, function(err, l) {
                            doconn((l?l.id:null));
                        });

                    } else {
                        doconn(null);
                    }

                }, function(err) {
                    // .each complete
                    e = e||err;
                    callback(e);
                });
            },

            function(callback) {
                var isql = `
                    INSERT INTO dns_logs(connection_id,
                        type, ip, host, protocol, 
                        source_ip, destination_ip,
                        source_port, destination_port, logged_at)
                    SELECT c.id, $1, $2, $3, $4, $5, $6, $7, $8, $9
                    FROM connections c WHERE c.started_at = $10;`;

                var e = null;
                var sql=`SELECT * FROM dns ORDER BY timestamp ASC`;
                file.db.each(sql, function(err, row) {
                    if (err) { 
                        e = e||err; 
                        return; 
                    };

                    var params = [
                        row.type, row.ip, row.host, row.protocol,
                        row.srcip, row.destip, row.srcport, row.destport,
                        new Date(row.timestamp), new Date(row.connstart)
                    ];

                    client.query(isql, params, function(err) {
                        e = e||err; 
                    }); 

                }, function(err) {
                    // .each complete
                    e = e||err;
                    callback(e);
                });
            },

            function(callback) {
                var isql = `
                    INSERT INTO http_logs(connection_id,
                            http_verb,
                            http_verb_param,
                            http_status_code,
                            http_host,
                            referer,
                            content_type,
                            content_length,
                            protocol, source_ip, destination_ip,
                            source_port, destination_port, logged_at)
                    SELECT c.id, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
                    FROM connections c WHERE c.started_at = $14;`;

                var e = null;
                var sql=`SELECT * FROM http ORDER BY timestamp ASC`;
                file.db.each(sql, function(err, row) {
                    if (err) { 
                        e = e||err; 
                        return; 
                    };

                    var params = [
                        row.httpverb, row.httpverbparam, row.httpstatuscode,
                        row.httphost, row.referer, row.contenttype, row.contentlength,
                        row.protocol, row.srcip, row.destip, row.srcport, row.destport,
                        new Date(row.timestamp), new Date(row.connstart)
                    ];

                    client.query(isql, params, function(err) {
                        e = e||err; 
                    }); 

                }, function(err) {
                    // .each complete
                    e = e||err;
                    callback(e);
                });
            },

            function(callback) {
                // Update the session endtime just in case
                client.update('sessions', {ended_at : session.ended_at})
                    .where({id : session.id}).run(callback);
            },

            function(callback) {
                // Count foreground/background io for activities (running apps)
                //
                // FIXME: interpretation of the count really depends on the polling
                // interval, it would make more sense to store the real duration 
                // instead no ... ??
                // 
                var sql = `
                    INSERT INTO activity_io
                    SELECT 
                        a.id, 
                        a.session_id,
                        a.name,
                        a.description, 
                        a.idle, 
                        a.pid, 
                        a.logged_at, 
                        a.finished_at, 
                        COUNT(io.logged_at)
                    FROM activities a 
                    LEFT JOIN io 
                    ON io.logged_at BETWEEN a.logged_at AND a.finished_at
                        AND io.pid = a.pid
                        AND io.name = a.name
                        AND io.session_id = a.session_id
                    WHERE a.session_id = $1
                    GROUP BY a.id,a.session_id,a.name,a.description,a.idle,a.pid,a.logged_at,a.finished_at
                    ORDER BY a.logged_at;`;

                client.query(sql, [session.id], callback); 
            },

            function(callback) {
                // FIXME

                //Fill the processes_running table
                q = `
                    INSERT INTO processes_running
                    SELECT
                        $1::integer as device_id,
                        $2::integer as session_id,
                        p.dname,
                        (
                            SELECT 
                                COUNT(*)
                            FROM
                            (
                                SELECT 1 AS count
                                FROM processes
                                WHERE name = p.dname
                                    AND session_id = $2::integer
                                    AND logged_at BETWEEN $3::timestamp AND $4::timestamp
                                GROUP BY date_trunc('minute',logged_at + interval '30 seconds')
                            ) sq
                        )::integer AS process_running,
                        (
                            SELECT
                                EXTRACT (
                                    EPOCH FROM (
                                        LEAST(date_trunc('minute',ended_at + interval '30 seconds'), $4::timestamp) 
                                        - 
                                        GREATEST(date_trunc('minute',started_at + interval '30 seconds'), $3::timestamp)
                                    )
                                )/60
                            FROM sessions 
                            WHERE id = $2::integer
                        ) AS session_running,
                        $3::timestamp as start_at,
                        $4::timestamp as end_at
                    FROM(
                        SELECT
                        DISTINCT name AS dname
                        FROM processes
                        WHERE session_id = $2::integer
                    ) p
                `;
                p = 60 * 60 * 1000;

                var from = Math.floor(sess.started_at.getTime()/p)*p;   //The started_at truncated to the hour in millisecond
                var to   = Math.floor(sess.ended_at.getTime()/p+1)*p;   //The ended_at truncated to the hour + 1 hour in millisecond

                for(var i = 0; from+i*p < to; i++){
                    var f= new Date(from + i*p);
                    var t= new Date(from + (i+1)*p);
                    var args=[sess.device_id,sess.id,f,t];
                    DB.query(q,args,function(err,result){
                        if(err) return sails.log.error("There was some error inserting values to processes_running: " + err);
                        sails.log.info("Session (id: "+sess.id+") has inserted values to the processes_running table");
                    });
                }

            }

        ], callback); 
        // end waterfall - the callback will commit the transaction 
        // or rollback upon failures

    }, function(err, res) {
        // cleanup + handle transaction err/success
        async.waterfall([
            function(callback) {
                if (file.db) // sqlite conn
                    file.db.close(function() { callback(null); });
                else
                    callback(null);
            },
            function(callback) {
                if (file.uncompressed_path) // tmp file
                    fs.unlink(file.uncompressed_path, function() { callback(null); });
                else
                    callback(null);
            }
        ], function() {
            // finally signal transaction success/failure
            if (err) return cb(err);
            cb(undefined);
        });
    });

}; //process