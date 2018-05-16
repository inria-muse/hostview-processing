/**
 * process_sqlite.js
 */
var fs = require('fs-extra')
var debug = require('debug')('hostview')
var async = require('async')
var sqlite = require('sqlite3')
var utils = require('./utils')

/**
 *  Process a single sqlite file from Hostview.
 *
 *  We assume that each sqlite file corresponds to a 'session' and
 *  all that all raw data related to this session is in this sqlite file.
 */
module.exports.process = function (file, db, cb) {
  if (!file || !db) { return cb(new Error('[process_sqlite] missing arguments')) }

  // wrap everything in a transaction on the backend db --
  // any failure to write there will cancel the file processing
  // anc call cb with error

  // the session of this file
  var session = {
    file_id: file.id,
    device_id: file.device_id,
    started_at: null,
    ended_at: null,
    start_event: null,
    stop_event: null
  }

    
    var readloopESM = function (client, sql, dsttable, dstrow, callback) {
        var e = null
        
        var survey_session = {}
        var elementsToInsert = []
        
        var loop = function () {
        if (elementsToInsert.length === 0) {
                return callback(null,survey_session) // done
            }
            var a = elementsToInsert.shift()
            db._db.insert(dsttable, a).returning('*').row(function (err, res) {
                if (err) return callback(err)
                else {
                    survey_session[res.started_at] = res.id
                    loop()
                }
            })

        }
        file.db.each(sql, function (err, row) {
                if (e || err) {
                     // we can't abort the .each(), so just record the error
                     // -- alternative is to do .all() but .each avoids reading
                     // all the data in memory (some tables can be huge !!)
                     if (!e) debug('readloopESM fail: ' + dsttable, err)
                     e = e || err
                     return
                }
                     
                     // map from sqlite row to backend db row
                     var o = dstrow(row)
                     
                     // track the latest data row just in case
                     if (o.logged_at) { session.ended_at = utils.datemax(session.ended_at, o.logged_at) }
                     elementsToInsert.push(o)

                     
            }, function (err) {
                e = e || err
                loop()
            })
    
    }
    
  // helper func to refactor out the common processing pattern
  // (read rows from sqlite and insert to the backend fb)
  var readloop = function (client, sql, dsttable, dstrow, callback) {
    var e = null

    // fetch data from the sqlite
    file.db.each(sql, function (err, row) {
      if (e || err) {
        // we can't abort the .each(), so just record the error
        // -- alternative is to do .all() but .each avoids reading
        // all the data in memory (some tables can be huge !!)
        if (!e) debug('readloop fail: ' + dsttable, err)
        e = e || err
        return
      }

      // map from sqlite row to backend db row
      var o = dstrow(row)

      // track the latest data row just in case
      if (o.logged_at) { session.ended_at = utils.datemax(session.ended_at, o.logged_at) }

      // add to the backend table
      client.insert(dsttable, o).run(function (err, res) {
        // we can't abort the .each(), so just record the error
        // -- alternative is to do .all() but .each avoids reading
        // all the data in memory (some tables can be huge !!)
        // TODO: does this really work or there's some race conditions here ?
        if (!e && err) debug('readloop insert fail: ' + dsttable, err)
        e = e || err
      })
    }, function (err) {
      // .each() completed - pass on any error (or nothing on success)
      e = e || err
      debug('readloop complete: ' + dsttable, e)
      callback(e)
    })
  }

  // another helper to convert empty strings to nulls
  var getstr = function (row, col) {
    if (!row[col] || row[col] === '' || row[col].trim() === '') { return null }
    return row[col].trim()
  }

  // the processing goes as follows:
  //
  //   1) uncompress the file to a temp location
  //   2) open sqlite connection to the temp file
  //   3) create the session on the backend db
  //   4) bulk of the work: map sqlite tables to backend db
  //   5) process other derived tables and data
  //   6) cleanup temp file

  async.waterfall([

    function (callback) {
      callback(null, file.path, '/tmp/' + file.device_id)
    },

    utils.uncompress,

    function (path, callback) {
      debug('sqlite connect ' + path)
      file.uncompressed_path = path
      file.db = new sqlite.Database(path, sqlite.OPEN_READONLY, callback)
    },

    function (callback) {
      // get session start event (there should only be one)
      debug('select session start')
      var sql = `SELECT timestamp started_at, event start_event
                FROM session 
                WHERE event IN ('start','restart','autorestart','resume','autostart')
                ORDER BY timestamp ASC`
      file.db.get(sql, callback)
    },

    function (row, callback) {
      debug('session start', row)

      // stop here - there's no start event so the db is (assumed?) empty
      if (!row) return callback(new Error('no data'))

      session.started_at = new Date(row.started_at)
      session.start_event = row.start_event

      // get session end event (there should only be zero or one)
      var sql = `SELECT timestamp ended_at, event stop_event
                FROM session 
                WHERE event IN ('pause','stop','autostop','suspend')
                ORDER BY timestamp DESC`
      file.db.get(sql, callback)
    },

    function (row, callback) {
      debug('session stop', row)
      if (row) {
        session.ended_at = new Date(row.ended_at)
        session.stop_event = row.stop_event
      } else {
        // can happen if the hostview cli crashed
        session.stop_event = 'missing'
        session.ended_at = session.started_at
      }

      // store the session, returns the inserted row
      db._db.insert('sessions', session).returning('*').row(callback)
    },

    function (row, callback) {
      session.id = row.id
      debug('session', session)
      callback(null)
    },

    function (callback) {
      debug('wifistats')
      var sql = `SELECT * FROM wifistats ORDER BY timestamp ASC`
      readloop(db._db, sql, 'wifi_stats', function (row) {
        return {
          session_id: session.id,
          guid: getstr(row, 'guid'),
          t_speed: row.tspeed,
          r_speed: row.rspeed,
          signal: row.signal,
          rssi: row.rssi,
          state: row.state,
          logged_at: new Date(row.timestamp)
        }
      }, callback)
    },

    function (callback) {
      debug('processes')
      var sql = `SELECT * FROM procs ORDER BY timestamp ASC LIMIT 10`
      readloop(db._db, sql, 'processes', function (row) {
        return {
          session_id: session.id,
          pid: row.pid,
          name: getstr(row, 'name'),
          memory: row.memory,
          cpu: row.cpu,
          logged_at: new Date(row.timestamp)
        }
      }, callback)
    },

    function (callback) {
      debug('powerstates')
      var sql = `SELECT * FROM powerstate ORDER BY timestamp ASC`
      readloop(db._db, sql, 'power_states', function (row) {
        return {
          session_id: session.id,
          event: row.event,
          value: row.value,
          logged_at: new Date(row.timestamp)
        }
      }, callback)
    },

    function (callback) {
      debug('ports')
      var sql = `SELECT * FROM ports ORDER BY timestamp ASC`
      readloop(db._db, sql, 'ports', function (row) {
        return {
          session_id: session.id,
          pid: row.pid,
          name: getstr(row, 'name'),
          protocol: row.protocol,
          source_ip: getstr(row, 'srcip'),
          destination_ip: getstr(row, 'destip'),
          source_port: row.srcport,
          destination_port: row.destport,
          state: row.state,
          logged_at: new Date(row.timestamp)
        }
      }, callback)
    },

    function (callback) {
      debug('io')
      var sql = `SELECT * FROM io ORDER BY timestamp ASC`
      readloop(db._db, sql, 'io', function (row) {
        return {
          session_id: session.id,
          device: row.device,
          pid: row.pid,
          name: getstr(row, 'name'),
          logged_at: new Date(row.timestamp)
        }
      }, callback)
    },

    function (callback) {
      debug('deviceinfo')
      var sql = `SELECT * FROM sysinfo ORDER BY timestamp ASC`
      readloop(db._db, sql, 'device_info', function (row) {
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
        }
      }, callback)
    },

    function (callback) {
      debug('netlabels')
      var sql = `SELECT * FROM netlabel ORDER BY timestamp ASC`
      readloop(db._db, sql, 'netlabels', function (row) {
        return {
          session_id: session.id,
          guid: getstr(row, 'guid'),
          gateway: getstr(row, 'gateway'),
          label: getstr(row, 'label'),
          logged_at: new Date(row.timestamp)
        }
      }, callback)
    },

    function (callback) {
      debug('browseractivity')
      var sql = `SELECT * FROM browseractivity ORDER BY timestamp ASC`
      readloop(db._db, sql, 'browser_activity', function (row) {
        return {
          session_id: session.id,
          browser: getstr(row, 'browser'),
          location: getstr(row, 'location'),
          logged_at: new Date(row.timestamp)
        }
      }, callback)
    },

    function (callback) {
      debug('esm')

                   
      var sql = `SELECT * FROM esm ORDER BY timestamp ASC`
      
      readloopESM(db._db, sql, 'surveys', function (row) {
        return {
          session_id: session.id,
          ondemand: row.ondemand,
          qoe_score: row.qoe_score,
          duration: row.duration,
          started_at: new Date(row.timestamp),
          ended_at: new Date(row.timestamp + row.duration)
        }
      }, callback)
    },

    function (survey_session, callback) {
      debug('esm activity')
      
      if (!survey_session) {
        callback("cannot fill survey info because survey_session is empty (esm activity)" ) //what should we do here?
      }else{
          for (var elem in survey_session)
            debug('survey_session ' + elem)
      }

      var e = null
      var sql = `SELECT * FROM esm_activity_tags ORDER BY timestamp ASC`
      file.db.each(sql, function (err, row) {
        if (e || err) {
          e = e || err
          return
        };

        var surveyId = survey_session[new Date(row.timestamp)]
        if (surveyId == null){
                   debug ('something is wrong, we couldn\'t find a survey with the same start time') //keep trying with the other elements; todo we should report the failure somewhere
        }else{
            debug('find the corresponding survery with id ' + surveyId)
            
            var params = {
                survey_id : surveyId,
                process_name : row.appname,
                process_desc : row.description,
                tags : row.tags.split(',')
            }
            db._db.insert('survey_activity_tags', params).run(function (err, res) {
              e = e || err
        })}
      }, function (err) {
        // .each complete
        e = e || err
        callback(e, survey_session)
      })
    },

    
    function (survey_session, callback) {
      debug('esm problems')
      if (!survey_session) {
        callback("cannot fill survey info because survey_session is empty (esm problems)") //what should we do here?
      }

      var e = null
      var sql = `SELECT * FROM esm_problem_tags ORDER BY timestamp ASC`
      file.db.each(sql, function (err, row) {
        if (e || err) {
          e = e || err
          return
        };
                
        var surveyId = survey_session[new Date(row.timestamp)]
        if (surveyId == null){
            debug ('something is wrong, we couldn\'t find a survey with the same start time') //keep trying with the other elements; todo we should report the failure somewhere
        }else{
          var params = {
            survey_id : surveyId,
            process_name : row.appname,
            process_desc : row.description,
            tags : row.tags.split(',')
          }
        db._db.insert('survey_problem_tags', params).run(function (err, res) {
          e = e || err
        })}
      }, function (err) {
                // .each complete
        e = e || err
        callback(e,survey_session)
      })
    },

                   
    function (survey_session, callback) {
      debug('esm activity qoe')
      if (!survey_session) {
        callback("cannot fill survey info because survey_session is empty (esm activity qoe)") //what should we do here?
      }
                   
      var e = null
      var sql = `SELECT * FROM esm_activity_qoe ORDER BY timestamp ASC`
      file.db.each(sql, function (err, row) {
        if (e || err) {
          e = e || err
          return
        };
              
        var surveyId = survey_session[new Date(row.timestamp)]
        if (surveyId == null){
            debug ('something is wrong, we couldn\'t find a survey with the same start time') //keep trying with the other elements; todo we should report the failure somewhere
        }else{
          var params = {
            survey_id : surveyId,
            process_name : row.appname,
            process_desc : row.description,
            qoe : row.qoe
        }
                
        db._db.insert('survey_activity_qoe', params).run(function (err, res) {
          e = e || err
        })}
      }, function (err) {
      // .each complete
        e = e || err
        callback(e,survey_session)
      })
    },
                   
    function (survey_session, callback) {
        debug('esm activity importance')
        if (!survey_session) {
          callback("cannot fill survey info because survey_session is empty (esm activity importance)") //what should we do here?
        }
                   
        var e = null
        var sql = `SELECT * FROM esm_activity_importance ORDER BY timestamp ASC`
        file.db.each(sql, function (err, row) {
            if (e || err) {
                e = e || err
                return
            };
            var surveyId = survey_session[new Date(row.timestamp)]
            if (surveyId == null){
                debug ('something is wrong, we couldn\'t find a survey with the same start time') //keep trying with the other elements; todo we should report the failure somewhere
            }else{
                var params = {
                  survey_id : surveyId,
                  process_name : row.appname,
                  process_desc : row.description,
                  importance : row.importance
                }
              db._db.insert('survey_activity_importance', params).run(function (err, res) {
              e = e || err
          })}
        }, function (err) {
            // .each complete
            e = e || err
            callback(e)
        })
    },

                   
    function (callback) {
      debug('activity')

      // reading one ahead so we can log the finish as well
      var prev
      var rows = []
      var e = null

      var sql = `SELECT * FROM activity ORDER BY timestamp ASC`
      file.db.each(sql, function (err, row) {
        if (e || err) {
          e = e || err
          prev = undefined
          return
        };

        var o = {
          session_id: session.id,
          user_name: getstr(row, 'user'),
          pid: row.pid,
          name: getstr(row, 'name'),
          description: getstr(row, 'description'),
          fullscreen: row.fullscreen,
          idle: row.idle,
          logged_at: new Date(row.timestamp)
        }
        session.ended_at = utils.datemax(session.ended_at, o.logged_at)

        if (prev) {
          // ends when the new event happens
          prev.finished_at = new Date(row.timestamp)
          rows.push(prev)
        }
        prev = o
      }, function (err) {
        // .each complete
        e = e || err
        if (prev) {
          // insert the last activity event
          prev.finished_at = session.ended_at
          rows.push(prev)
        }

        debug('activies read, found ' + rows.length, e)
        if (e) return callback(e) // something failed during .each

        // now add all rows
        var loop = function () {
          if (rows.length === 0) return callback(null) // done
          var a = rows.shift()
          db._db.insert('activities', a).run(function (err, res) {
            if (err) return callback(err)
            loop()
          })
        }
        loop()
      })
    },

    db._db.update('sessions', { ended_at: session.ended_at })
            .where({ id: session.id }).run,

    function (res, callback) {
      debug('connectivity')

      // FIXME:: this is really slow on sqlite - there's no indexes
      // or nothing so takes forever, do as with activity !!!

      var e = null
      var sql = `SELECT 
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
                    ORDER BY a.mac ASC, started_at ASC`

      file.db.each(sql, function (err, row) {
        if (e || err) {
          e = e || err
          return
        };

        var doconn = function (lid) {
          var o = {
            session_id: session.id,
            location_id: lid,
            started_at: new Date(row.started_at),
            ended_at: (row.ended_at ? new Date(row.ended_at) : session.ended_at),
            guid: getstr(row, 'guid'),
            friendly_name: getstr(row, 'row.friendlyname'),
            description: getstr(row, 'row.description'),
            dns_suffix: getstr(row, 'dnssuffix'),
            mac: getstr(row, 'mac'),
            ips: row.ips.split(','),
            gateways: row.gateways.split(','),
            dnses: row.dnses.split(','),
            t_speed: row.tspeed,
            r_speed: row.rspeed,
            wireless: row.wireless,
            profile: getstr(row, 'profile'),
            ssid: getstr(row, 'ssid'),
            bssid: getstr(row, 'bssid'),
            bssid_type: getstr(row, 'bssidtype'),
            phy_type: getstr(row, 'phytype'),
            phy_index: row.phyindex,
            channel: row.channel
          }

          db._db.insert('connections', o).run(function (err, res) {
            e = e || err
          })
        }

        if (row.public_ip) {
          // insert/get the location first
          var l = {
            public_ip: getstr(row, 'public_ip'),
            reverse_dns: getstr(row, 'reverse_dns'),
            asn_number: getstr(row, 'asnumber'),
            asn_name: getstr(row, 'asname'),
            country_code: getstr(row, 'countryCode'),
            city: getstr(row, 'city'),
            latitude: getstr(row, 'lat'),
            longitude: getstr(row, 'lon')
          }

          var locations = 'locations'

          db._db.select('*').from(locations)
                        .where(l).rows(function (err, rows) {
                          if (err) return callback(err)
                          if (rows.length === 0) {
                            db._db.insert(locations, row).returning('*').row(function (err, res) {
                              if (err) return callback(err)
                              doconn(res.id)
                            })
                          } else {
                            doconn(rows[0].id)
                          }
                        })
        } else {
          doconn(null)
        }
      }, function (err) {
                // .each complete
        e = e || err
        callback(e)
      })
    },

    function (callback) {
      debug('dnslogs')
      var isql = `
                INSERT INTO dns_logs(connection_id,
                    type, ip, host, protocol, 
                    source_ip, destination_ip,
                    source_port, destination_port, logged_at)
                SELECT c.id, 
                       $1, 
                       $2, 
                       $3, 
                       $4, 
                       $5, 
                       $6, 
                       $7, 
                       $8, 
                       $9
                FROM connections c WHERE c.started_at = $10;`

      var e = null
      var sql = `SELECT * FROM dns ORDER BY timestamp ASC`
      file.db.each(sql, function (err, row) {
        if (e || err) {
          e = e || err
          return
        };

        var params = [
          row.type, row.ip, row.host, row.protocol,
          row.srcip, row.destip, row.srcport, row.destport,
          new Date(row.timestamp), new Date(row.connstart)
        ]

        db._db.raw(isql, params).run(function (err, res) {
          e = e || err
        })
      }, function (err) {
        // .each complete
        e = e || err
        callback(e)
      })
    },

    function (callback) {
      debug('httplogs')

      var isql = `
                INSERT INTO http_logs(
                    connection_id,
                    http_verb,
                    http_verb_param,
                    http_status_code,
                    http_host,
                    referer,
                    content_type,
                    content_length,
                    protocol, 
                    source_ip, 
                    destination_ip,
                    source_port, 
                    destination_port, 
                    logged_at)
                SELECT c.id, 
                       $1, 
                       $2, 
                       $3, 
                       $4, 
                       $5, 
                       $6, 
                       $7, 
                       $8, 
                       $9, 
                       $10, 
                       $11, 
                       $12, 
                       $13
                FROM connections c WHERE c.started_at = $14;`

      var e = null
      var sql = `SELECT * FROM http ORDER BY timestamp ASC`

      file.db.each(sql, function (err, row) {
        if (e || err) {
          e = e || err
          return
        };

        var params = [
          getstr(row, 'httpverb'),
          getstr(row, 'httpverbparam'),
          getstr(row, 'httpstatuscode'),
          getstr(row, 'httphost'),
          getstr(row, 'referer'),
          getstr(row, 'contenttype'),
          getstr(row, 'contentlength'),
          row['protocol'],
          getstr(row, 'srcip'),
          getstr(row, 'destip'),
          row['srcport'],
          row['destport'],
          new Date(row.timestamp),
          new Date(row.connstart)
        ]

        db._db.raw(isql, params).run(function (err, res) {
          e = e || err
        })
      }, function (err) {
        // .each complete
        e = e || err
        callback(e)
      })
    }
        /*,

        TODO: these are working but do we need these ?

        function(callback) {
            debug('activity_io');

            // Count foreground/background io for activities (running apps)
            //
            // FIXME: interpretation of the count really depends on the polling
            // interval, it would make more sense to store the real duration
            // instead no ... ??
            //
            var sql = `INSERT INTO activity_io
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
                GROUP BY a.id
                ORDER BY a.id;`;

            db._db.raw(sql, [session.id]).run(callback);
        },

        function(res, callback) {
            debug('processes_running');

            // Fill the processes_running table
            // TODO: what's with the intervals in the queries .. ?
            var sql = `INSERT INTO processes_running
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
                ) p`;

            // run the above query for 1h bins from session start to end
            var bin = 60 * 60 * 1000;
            var from = Math.floor(session.started_at.getTime()/bin)*bin;
            var to   = Math.floor(session.ended_at.getTime()/bin+1)*bin;

            var loop = function(d) {
                if (d>=to) return callback(null);

                var args = [session.device_id,
                            session.id,
                            new Date(d),
                            new Date(d+bin)];

                db._db.raw(sql, args).run(function(err,res) {
                    if (err) return callback(err); // stop on error
                    process.nextTick(loop,d+bin);
                });
            };

            loop(from);
        }
        */
  ],
    function (err) {
      // if we receive error here, something went wrong above ...
      async.waterfall([
        function (callback) {
          if (err) {
            debug('failed to process session ' + session.id, err)
            if (session.id) { db._db.delete('sessions').where({ id: session.id }).run(callback) }
            callback(err)
          } else {
            debug('session inserted ' + session.id)
            callback(null, null)
          }
        },
        function (res, callback) {
          if (file.db) { // sqlite conn
            file.db.close(function () { callback(null) })
          } else { callback(null) }
        },
        function (callback) {
          if (file.uncompressed_path) { // tmp file
            fs.unlink(file.uncompressed_path, function () { callback(null) })
          } else { callback(null) }
        }
      ], function () {
        // return the original error (if any)
        return cb(err)
      }) // cleanup waterfall
    }) // main watefall
} // process
