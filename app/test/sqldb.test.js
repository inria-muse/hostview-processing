var assert = require('chai').assert;
var expect = require('chai').expect;

var sqldb = require('../lib/sqldb');

describe('sqldb', function() {
    var db = null;
    var devrowid = null;

    before(function(done) {        
        // runs before all tests in this block
        db = new sqldb.DB(process.env.PROCESS_DB);
        db.clearall(done);
    });

    describe('#select()', function() {
        it('should find nothing from empty DB', function(done) {
            db.select('devices', undefined, function(err, res) {
                assert.equal(!err, true);
                expect(res.length).to.equal(0);
                done();
            });
        });
    });

    describe('#getOrInsert()', function() {
        var dev = { device_id : 'testdev'};

        it('should add new device', function(done) {
            db.getOrInsert('devices', dev, function(err, res) {
                assert.equal(!err, true);
                devrowid = res.id;
                done();
            });
        });

        it('should return the existing device', function(done) {
            db.getOrInsert('devices', dev, function(err, res) {
                assert.equal(!err, true);
                assert.equal(res.id==devrowid, true);
                done();
            });
        });
    });

    describe('#insertOrUpdateFile()', function() {
        var f = {
            folder: '/tmp',
            basename: 'foo.txt',
            status: 'processing',
            device_id: devrowid,
            hostview_version: '0.0.1' 
        };

        it('should add new file', function(done) {            
            db.insertOrUpdateFile(f, function(err, res) {
                assert.equal(!err, true);
                assert.equal(res!=undefined, true);
                assert.equal(res.id != undefined, true);
                expect(res.created_at).to.be.a("Date");
                expect(res.updated_at).to.be.a("Date");
                expect(Math.abs(res.created_at.getTime() - res.updated_at.getTime()) < 10)
                    .to.equal(true);
                setTimeout(done, 10); // add sometimeout for next test
            });
        });

        it('should update file', function(done) {
            f.status = 'success';
            db.insertOrUpdateFile(f, function(err, res) {
                assert.equal(!err, true);
                assert.equal(res!=undefined, true);
                assert.equal(res.id != undefined, true);
                expect(res.created_at).to.be.a("Date");
                expect(res.updated_at).to.be.a("Date");
                expect(Math.abs(res.created_at.getTime() - 
                                res.updated_at.getTime()) > 10).to.equal(true);
                done();
            });
        });

        it('should return duplicate error', function(done) {
            f.status = 'processing';
            db.insertOrUpdateFile(f, function(err, res) {
                assert.equal(err!=undefined, true);
                done();
            });
        });

    });
});