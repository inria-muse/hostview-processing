var path = require('path');
var fs = require('fs-extra');

var assert = require('chai').assert;
var expect = require('chai').expect;

var process_sqlite = require('../lib/process_sqlite');
var sqldb = require('../lib/sqldb');

describe('process_sqlite', function() {
    var db = null;
    // in the container
    var testfile = '/app/test/testdata/1468852623282_stats.db.zip';
    var file = null;

    before(function(done) {        
        db = new sqldb.DB(process.env.PROCESS_DB);

        db.clearall(function(err) {
            if (err) return done(err);

            db.getOrInsert('devices', { device_id : 'testdev' }, function(err, dev) {            
                if (err) return done(err);

                var f = {
                  folder: path.dirname(testfile),
                  basename: path.basename(testfile),
                  status: 'processing',
                  device_id: dev.id,
                  hostview_version: '0.0.1' 
                };

                db.insertOrUpdateFile(f, function(err, res) {
                    file = res;
                    file.path = testfile;

                    done(err);
                });
            });
        });
    });

    describe('#process()', function() {
        it('should return Error on missing args', function(done) {
            process_sqlite.process('foo', undefined, function(err) {
                assert.equal(!!err, true);
                done();
            });
        });

        it('should not error on db file', function(done) {
            process_sqlite.process(file, db, function(err) {
                assert.equal(!err, true);
                db._db.select('*').from('sessions').row(function(err, row) {
                    assert.equal(!err, true);
                    assert.equal(row!=undefined, true);
                    // TODO: should really test for other tables too .. 
                    done();
                });
            });
        });
    });

});