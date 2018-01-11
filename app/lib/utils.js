/**
 * utils.js
 *
 * Common helper functions.
 */
var fs = require('fs-extra')
var childProcess = require('child_process')
var path = require('path')

/**
 * Uncompress the given src archive file to dst folder.
 *
 * Returns the name of the uncomressed file (caller is responsible
 * for cleaning it up eventually).
 */
module.exports.uncompress = function (src, dst, cb) {
  try {
    fs.ensureDirSync(dst)

    childProcess.exec(
            'dtrx -q -n -f ' + src,
            { cwd: dst },
            function (err, stdout, stderr) {
              if (err) return cb(err)
              return cb(null, path.join(dst, path.basename(src).replace('.zip', '')))
            })
  } catch (err) {
    cb(err, undefined)
  }
}

/** Return max of the two dates. */
module.exports.datemax = function (a, b) {
  if (!b) return a
  if (!a) return b
  return (a.getTime() >= b.getTime() ? a : b)
}

/** Return max of the two dates. */
module.exports.datemin = function (a, b) {
  if (!b) return a
  if (!a) return b
  return (a.getTime() <= b.getTime() ? a : b)
}
