/**
 * process_pcap.js
 */
var debug = require('debug')('hostview')
var path = require('path')
var fs = require('fs-extra')
var async = require('async')
var glob = require('glob')
var childProcess = require('child_process')
var utils = require('./utils')

/**
 * Process raw partial pcaps from Hostview. While all parts are not
 * available, the parts are stored to a process folder. Once all parts
 * have been received, the actual pcap processing (tcptrace) is done.
 *
 * The tcptrace processing is done using the python scripts in 'python-src'.
 */
module.exports.process = function (file, db, config, cb) {
  if (!file || !db || !config) { return cb(new Error('[process_pcap] missing arguments')) }

  // parse file name into file info
  var getinfo = function (p) {
    // format: sessionstarttime_connectionstarttime_filenum_adapterid_[part|last].pcap.zip
    var base = path.basename(p)
    var info = base.replace('.pcap.zip', '').replace('.pcap', '').split('_')

    if (info.length !== 5) return undefined
    return {
      basename: base,
      session_ts: parseInt(info[0]),
      conn_ts: parseInt(info[1]),
      filenum: parseInt(info[2]),
      adapter: info[3],
      part: info[4],
      islast: (info[4] === 'last')
    }
  }

  var finfo = getinfo(file.path)
  debug('process pcap ' + file.path, finfo)

  if (!finfo) { return cb(new Error('[process_pcap] invalid filename: ' + file.path)) }

  // this is where the parts + tmp files live (merged files + tcptrace data)
  // everything here is uncompressed
  var workdir = config.pcap_dir + '/' + file.device_id

  // uncompress the file to the pcap folder for processing
  utils.uncompress(file.path, workdir, function (err, fn) {
    if (err) return cb(err)

    // check if we've got the last + all parts for this capture session
    var p = workdir + '/' + finfo.session_ts + '_' + finfo.conn_ts + '_*_' + finfo.adapter + '_*.pcap'
    debug('glob', p)

    glob(p, function (err, files) {
      if (err) return cb(err)

      var lastfilenum = -1
      var fileinfos = []

      files.forEach(function (item) {
        var finfo = getinfo(item)
        if (finfo.islast) { lastfilenum = finfo.filenum }
        fileinfos.push(finfo)
      })

      debug('lastfilenum ' + lastfilenum, fileinfos)

      if (lastfilenum < 0 || fileinfos.length < lastfilenum + 1) { return cb(null) } // missing parts, just signal this part handled for now

      // all parts available - merge and process to the db
      var mergedfile = workdir + '/' + finfo.session_ts + '_' + finfo.conn_ts + '_' + finfo.adapter + '.pcap'
      debug('handle complete pcap ' + mergedfile)

      async.waterfall([
        function (callback) {
          if (files.length > 1) {
            // combine all parts into a single pcap file
            var cmd = 'tracemerge -Z none pcap:' + mergedfile + ' ' + files.join(' ')
            debug('merge', cmd)
            childProcess.exec(
                            cmd,
                            function (err, stdout, stderr) {
                              debug(err, stdout, stderr)
                              if (err) return callback(err)
                              return callback(null)
                            }
                        )
          } else {
            debug('move ' + files[0] + ' to ' + mergedfile)
            fs.move(files[0], mergedfile, callback)
          }
        },

        function (callback) {
          debug('pcap')
          var isql = `INSERT INTO pcap(
                        connection_id,
                        status,
                        folder,
                        basename)
                        SELECT c.id, $1, $2, $3
                        FROM connections c WHERE c.started_at = $4;`

          var params = [
            'processing',
            file.folder,
            path.basename(mergedfile),
            new Date(finfo.conn_ts)
          ]

          debug('insert', params)
          db._db.raw(isql, params).run(function (err, res) {
            callback(err)
          })
        },

        function (callback) {
          debug('pcap_file')

          var isql = `INSERT INTO pcap_file(
                        pcap_id,
                        file_id,
                        file_order)
                        SELECT p.id, $1, $2
                        FROM pcap p WHERE p.basename = $3;`

          var loop = function () {
            if (fileinfos.length === 0) { return callback(null) }
            var item = fileinfos.shift()

            // find the file info
            db._db.select('*')
                            .from('files')
                            .where({
                              device_id: file.device_id,
                              basename: item.basename + '.zip'
                            })
                            .row(function (err, row) {
                              if (err) return callback(err)

                              var params = [
                                row.id,
                                item.filenum,
                                path.basename(mergedfile)
                              ]
                              debug('insert', params)
                              db._db.raw(isql, params).run(function (err, res) {
                                if (err) return callback(err)
                                process.nextTick(loop)
                              })
                            }) // select
          }
          loop()
        },

        function (callback) {
          // call the tcptrace python script to process the pcap file
          childProcess.exec(
                        'python ' + config.tcptrace_script + ' ' + mergedfile,
            {
              cwd: path.dirname(config.tcptrace_script),
              env: { PROCESS_DB: config.pydb }
            },
                        function (err, stdout, stderr) {
                          debug(err, stdout, stderr)
                          if (err) return callback(err)
                          return callback(null)
                        }
                    )
        },

        function (callback) {
          // move the combined trace to processed_dir
          try {
            var dst = config.processed_dir + '/' + file.folder + '/' + path.basename(mergedfile)
            debug('move ' + mergedfile + ' to ' + dst)
            fs.moveSync(mergedfile, dst)
          } catch (err) {
          }
          callback(null)
        },

        function (callback) {
          // remove the partial files (copy is already in processed_dir)
          try {
            files.forEach(function (item) {
              debug('remove ' + item)
              fs.unlinkSync(item)
            })
          } catch (err) {
          }
          callback(null)
        }
      ],
            function (err) {
              debug('process done', err)
              if (err) {
                // cleanup processing state
                db.delete('pcap', {basename: path.basename(mergedfile)}, function () {
                  try {
                    fs.unlinkSync(mergedfile)
                  } catch (err) {
                  }
                  // note we leave the uncompressed parts to the workdir
                  cb(err)
                })
              } else {
                // all good!
                cb(null)
              }
            }) // waterfall
    }) // glob
  }) // uncompress
} // process
