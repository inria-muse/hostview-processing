var assert = require('chai').assert;
var expect = require('chai').expect;

var sqldb = require('../lib/sqldb');

describe('sqldb', function() {
    var db = null;
    var devrowid = null;

    before(function() {
        // runs before all tests in this block
        db = new sqldb.DB(process.env.PROCESS_DB);
    });

    describe('#getOrInsertDevice()', function() {
        var devid = 'test_'+Date.now();

        it('should add new device', function(done) {
            db.getOrInsertDevice(devid, function(err, res) {
                assert.equal(!err, true);
                assert.equal(!res.existed, true);
                devrowid = res.id;
                done();
            });
        });

        it('should return the existing device', function(done) {
            db.getOrInsertDevice(devid, function(err, res) {
                assert.equal(!err, true);
                assert.equal(res.existed, true);
                assert.equal(res.id==devrowid, true);
                done();
            });
        });
    });

    describe('#insertOrUpdateFile()', function() {
        var f = {
            folder: '/tmp',
            basename: Date.now() + '_dat.txt',
            status: 'init',
            device_id: devrowid,
            hostview_version: '0.0.1' 
        };

        it('should add new file', function(done) {
            db.insertOrUpdateFile(f, function(err, res) {
                expect(err).to.equal(null);
                assert.equal(!res, false);
                assert.equal(res.id != undefined, true);
                expect(res.created_at).to.be.a("Date");
                expect(res.updated_at).to.be.a("Date");
                expect(Math.abs(res.created_at.getTime() - res.updated_at.getTime()) < 10)
                    .to.equal(true);
                done();
            });
        });

        it('should update file', function(done) {
            f.status = 'update';
            db.insertOrUpdateFile(f, function(err, res) {
                assert.equal(!err, true);
                expect(Math.abs(res.created_at.getTime() - res.updated_at.getTime()) > 10)
                    .to.equal(true);
                done();
            });
        });

    });
});