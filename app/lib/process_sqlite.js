/**
 * process_sqlite.js
 */
var fs = require('fs-extra')
    , utils = require('./utils')
    , async = require('async')
    , sqlite = require('sqlite3');

/** Process a single sqlite file from Hostview.
 *
 *  We assume that each sqlite file corresponds to a 'session' and
 *  all that all raw data related to this session is in this sqlite file.
 */
module.exports.process = function(file, db, cb) {

    // wrap everything in a transaction on the backend db --
    // any failure to write there will cancel the file processing
    // anc call cb with error
    db.transaction(function(client, callback)) {
        // each file maps to a session
        var session = {
            id = null,
            file_id: file.id,
            device_id: file.device_id,
            started_at: null,
            ended_at: null,
            start_event: null,
            stop_event: null          
        };

        // the processing goes as follows:
        //   1) uncompress the file to a temp location
        //   2) open sqlite connection to the temp file
        //   3) add the session row to the backend db
        //   4) bulk of the work: map sqlite tables to backend db
        //   5) process derived tables and data
        //   6) cleanup temp file

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
                // get session start event
                sql=`SELECT timestamp started_at, event start_event
                    FROM session 
                    WHERE event IN ('start','restart','autorestart','resume','autostart')`;
                file.db.get(sql, callback);
            },

            function(row, callback) {
                if (!row) return callback(new Error('No data'));

                session.started_at = new Date(row.started_at);
                session.start_event = row.start_event;

                // get session end event
                sql=`SELECT timestamp ended_at, event end_event
                    FROM session 
                    WHERE event IN ('pause','stop','autostop','suspend')`;
                file.db.get(sql, callback);
            },

            function(row, callback) {
                if (row) {
                    session.ended_at = new Date(row.end_at);
                    session.end_event = row.end_event;
                } else {
                    session.end_event = 'missing';
                    session.ended_at = session.started_at;
                }

                // store the session, returns the inserted row
                client.insert('sessions', session).returning('*').row(callback);
            },

            function(row, callback) {
                session.id = row.id;
                callback(undefined);
            },

            function(callback) {
                sql=`SELECT * FROM wifistats ORDER BY timestamp ASC`;
                file.db.each(sql, function(err, row) {
                    if (err) return callback(err);
                    var o = {
                        session_id: session.id,
                        guid: row.guid,
                        t_speed: row.tspeed,
                        r_speed: row.rspeed,
                        signal: row.signal,
                        rssi: row.rssi,
                        state: row.state,
                        logged_at: new Date(row.timestamp)
                    };
                    session.ended_at = utils.datemax(session.ended_at,o.logged_at);
                    client.insert('wifi_stats',o).run(function(err) {
                        if (err) return callback(err);
                    });
                }, callback);
            },

            function(callback) {
                sql=`SELECT * FROM procs ORDER BY timestamp ASC`;
                file.db.each(sql, function(err, row) {
                    if (err) return callback(err);
                    var o = {
                        session_id: session.id,
                        pid: row.pid,
                        name: row.name,
                        memory: row.memory,
                        cpu: row.cpu,
                        logged_at: new Date(row.timestamp)
                    };
                    session.ended_at = utils.datemax(session.ended_at,o.logged_at);
                    client.insert('processes',o).run(function(err) {
                        if (err) return callback(err);
                    });
                }, callback);
            },

            function(callback) {
                sql=`SELECT * FROM powerstate ORDER BY timestamp ASC`;
                file.db.each(sql, function(err, row) {
                    if (err) return callback(err);
                    var o = {
                        session_id: session.id,
                        event: row.event,
                        value: row.value,
                        logged_at: new Date(row.timestamp)
                    };
                    session.ended_at = utils.datemax(session.ended_at,o.logged_at);
                    client.insert('power_states',o).run(function(err) {
                        if (err) return callback(err);
                    });
                }, callback);
            },

            function(callback) {
                sql=`SELECT * FROM ports ORDER BY timestamp ASC`;
                file.db.each(sql, function(err, row) {
                    if (err) return callback(err);
                    var o = {
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
                    session.ended_at = utils.datemax(session.ended_at,o.logged_at);
                    client.insert('ports',o).run(function(err) {
                        if (err) return callback(err);
                    });
                }, callback);
            },

            function(callback) {
                sql=`SELECT * FROM io ORDER BY timestamp ASC`;
                file.db.each(sql, function(err, row) {
                    if (err) return callback(err);
                    var o = {
                        session_id: session.id,
                        device: row.device,
                        pid: row.pid,
                        name: row.name,
                        logged_at: new Date(row.timestamp)
                    };
                    session.ended_at = utils.datemax(session.ended_at,o.logged_at);
                    client.insert('io',o).run(function(err) {
                        if (err) return callback(err);
                    });
                }, callback);
            },

            function(callback) {
                sql=`SELECT * FROM sysinfo ORDER BY timestamp ASC`;
                file.db.each(sql, function(err, row) {
                    if (err) return callback(err);
                    var o = {
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
                    client.insert('device_info',o).run(function(err) {
                        if (err) return callback(err);
                    });
                }, callback);
            },

            function(callback) {
                sql=`SELECT * FROM netlabel ORDER BY timestamp ASC`;
                file.db.each(sql, function(err, row) {
                    if (err) return callback(err);
                    var o = {
                        session_id: session.id,
                        guid: row.guid,
                        gateway: row.gateway,
                        label: row.label,
                        logged_at: new Date(row.timestamp)
                    };
                    client.insert('netlabels',o).run(function(err) {
                        if (err) return callback(err);
                    });
                }, callback);
            },

            function(callback) {
                // reading one ahead so we can log the finish time at once
                var prev = undefined;

                sql=`SELECT * FROM activity ORDER BY timestamp ASC`;
                file.db.each(sql, function(err, row) {
                    if (err) return callback(err);

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
                        prev.finished_at = o.logged_at;
                        client.insert('activities', prev).run(function(err) {
                            if (err) return callback(err);
                            prev = o;
                        });
                    }
                }, function(err) {
                    if (err) return callback(err);

                    // insert the last activity event
                    if (prev) {
                        prev.finished_at = session.ended_at;
                        client.insert('activities', prev).run(function(err) {
                            if (err) return callback(err);
                            return callback(undefined);
                        });
                    }
                });
            },

            // TODO: connections + related stuff!! 

            function(callback) {
                // Update the session endtime just in case
                client.update('sessions', {ended_at : session.ended_at})
                    .where({id : session.id}).run(callback);
            },

            function(callback) {
                // Count foreground/background io for activities (running apps)
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
            }

            // TODO: other processing ?

        ], callback); // end waterfall - the callback will commit the transaction

    }, function(err, res) {
        // handle transaction err/success
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
            // finally signal success/failure
            if (err) return cb(err);
            cb(undefined);
        });
    });
}; //process

    createCompleteSession: function(session,file,cb){
        if(session)
            function createConnections(sess, callback){

                var runCallback = function(){
                    //When dns and http are processed, then it's possible to run the callback
                    var nextf=true;
                    for(var j= 0; j < conn_processed.length; j++){
                        if(!(conn_processed[j].dns && conn_processed[j].http )){
                            nextf = false;
                            break;
                        }
                    }
                    return nextf
                }

                var createDNS = function (conn,dns_array,conn_index){


                    var dnss=[];
                    var dns;
                    while(dns_array.length>0){
                        dns = dns_array.shift();

                        dns.logged_at = new Date(dns.timestamp);
                        dns.source_ip = dns.srcip
                        dns.destination_ip = dns.destip
                        dns.source_port = dns.srcport
                        dns.destination_port = dns.destport
                        dns.connection_id= conn.id;


                        delete dns.timestamp;
                        delete dns.srcip
                        delete dns.destip
                        delete dns.srcport
                        delete dns.destport
                        delete dns.connstart

                        dnss.push(dns);
                    }

                    DB.insert('dns_logs',dnss,function(err,inserted_values){
                        if(err) return callback(sess)

                        conn_processed[conn_index].dns = true;
                        if(runCallback()) return callback(null,sess);
                    });
                };

                var createHTTP = function(conn,http_array,conn_index){
                    var https=[];
                    var http;
                    while(http_array.length>0){
                        http = http_array.shift();

                        http.logged_at = new Date(http.timestamp);
                        http.http_verb = http.httpverb;
                        http.http_verb_param = http.httpverbparam
                        http.http_status_code = http.httpstatuscode
                        http.http_host = http.httphost
                        http.content_type = http.contenttype
                        http.content_length = http.contentlength
                        http.source_ip = http.srcip
                        http.destination_ip = http.destip
                        http.source_port = http.srcport
                        http.destination_port = http.destport

                        http.connection_id= conn.id;


                        delete http.httpverb;
                        delete http.httpverbparam
                        delete http.httpstatuscode
                        delete http.httphost
                        delete http.contenttype
                        delete http.contentlength
                        delete http.srcip
                        delete http.destip
                        delete http.srcport
                        delete http.destport
                        delete http.timestamp
                        delete http.connstart

                        https.push(http);
                    }

                    DB.insert('http_logs',https,function(err,inserted_values){
                        if(err) return callback(sess)
                        conn_processed[conn_index].http = true;
                        if(runCallback()) return callback(null,sess);

                    });
                }

                var createConnection = function(location_id,connection,connection_with_location,index){
                    
                    connection.location_id = location_id;
                    var dns_array = connection_with_location.dns;
                    var http_array = connection_with_location.http;

                    DB.insertOne('connections',connection,function(err,con_c){
                        if(err){
                            file.status = 'failed'
                            file.error_info =  "There's some error inserting connections: " + err
                            return callback({id: connection.session_id})
                        }
                        sails.log.info("Connection inserted with id: " + con_c.id);

                        createDNS(con_c,dns_array,index);
                        createHTTP(con_c,http_array,index);
                    });
                }

                var connections=[];
                var conn_processed = [];
                for(var i = 0; i < session.connections.length; i++)
                    conn_processed.push({dns:false,http:false});

                var cwl={}, conn= {}, loc = {};
                var i  = 0;
                while(session.connections.length>0){
                    
                    cwl= session.connections.shift(); //connection with location info


                    conn.session_id = sess.id;
                    conn.started_at=new Date(cwl.started_at);
                    conn.ended_at=cwl.ended_at<Infinity?new Date(cwl.ended_at): new Date(session.ended_at);
                    conn.name = cwl.name
                    conn.friendly_name = cwl.friendlyname
                    conn.description = cwl.description
                    conn.dns_suffix = cwl.dnssuffix
                    conn.mac = cwl.mac
                    conn.ips = cwl.ips.split(",");
                    conn.gateways = cwl.gateways.split(",");
                    conn.dnses = cwl.dnses.trim().split(",");
                    conn.t_speed= cwl.tspeed;
                    conn.r_speed= cwl.rspeed;
                    conn.wireless= cwl.wireless;
                    conn.profile= cwl.profile;
                    conn.ssid= cwl.ssid;
                    conn.bssid= cwl.bssid;
                    conn.bssid_type = cwl.bssidtype;
                    conn.phy_type = cwl.phytype;
                    conn.phy_index = cwl.phyindex;
                    conn.connected = cwl.connected;

                    if(cwl.rdns){ //has location info

                        loc.public_ip = cwl.public_ip.trim();
                        loc.reverse_dns = cwl.reverse_dns.trim();
                        loc.asn_number = cwl.asnumber.trim();
                        loc.asn_name = cwl.asname.trim();
                        loc.country_code = cwl.countryCode.trim();
                        loc.city = cwl.city.trim();
                        loc.latitude = cwl.lat.trim();
                        loc.longitude = cwl.lon.trim();

                        DB.createOneIfNotExist('locations',loc,function(err,loc_c){
                            if(err){
                                file.status = 'failed'
                                file.error_info =  "There's some error querying/inserting locations: " + err
                                return callback(sess)
                            }

                            createConnection(loc_c.id,conn,cwl,i)
                        });

                    }
                    else createConnection(null,conn,cwl,i);

                    i++;
                }
            },

        ],
        function(err,sess){
            if(err && err.id) 
                DB.deleteRow('sessions',{id: err.id}, function(qerr,res){
                    
                    //This happen cause all the tables has a ON DELETE CASCADE statement for the session_id.
                    sails.log.warn("All the information associated with this session (id: " +  err.id + ") was deleted")


                    file.status = 'failed'
                    file.error_info = "There was some errors processing the session file"

                    return cb(null)
                })
            else{
                //ALL THE PROCESSING QUERYS HERE
                //=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

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

                //=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-



                return cb(err); //Go to the next file
            }
        });
}