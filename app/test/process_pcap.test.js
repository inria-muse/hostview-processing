var path = require('path');
var fs = require('fs-extra');

var assert = require('chai').assert;
var expect = require('chai').expect;

var process_pcap = require('../lib/process_pcap');
var sqldb = require('../lib/sqldb');

describe('process_pcap', function() {
    var db = null;
    // in the container
    var testfile = '/app/test/testdata/1468851053935_1468851067840_0_1412A769-47D9-4AEA-B85D-6A04CF364CEA_last.pcap.zip';
    var file = null;

    var cfg = {
        pcap_dir : '/data/pcapparts',
        processed_dir : '/data/processed',
        db: process.env.PROCESS_DB,
        pydb: process.env.PROCESS_DB.replace('postgres://','postgresql+psycopg2://'),
        tcptrace_script : '/python/main.py'
    };

    before(function(done) {        

        try {
            fs.ensureDirSync(cfg.processed_dir);
            fs.ensureDirSync(cfg.pcap_dir);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }

        db = new sqldb.DB(cfg.db);

        db.clearall(function(err) {
            if (err) return done(err);

            db.getOrInsert('devices', { device_id : 'testdev' }, function(err, dev) {            
                if (err) return done(err);

                var f = {
                  folder: path.dirname(testfile).replace('/',''),
                  basename: path.basename(testfile),
                  status: 'processing',
                  device_id: dev.id,
                  hostview_version: '0.0.1' 
                };

                db.insertOrUpdateFile(f, function(err, res) {
                    file = res;
                    file.path = testfile;

                    // fake session + connection so that the pcap stuff works
                    db.insert('sessions', { 
                        file_id : res.id, 
                        device_id : dev.id, 
                        started_at : new Date(1468851053935)
                    }, function(err, res) {
                        db.insert('connections', { 
                            session_id : res.id, 
                            started_at : new Date(1468851067840) 
                        }, function(err, res) {
                            done();
                        });
                    });
                });
            });
        });
    });

    describe('#process()', function() {
        it('should return Error on missing args', function(done) {
            process_pcap.process(file, undefined, cfg, function(err) {
                assert.equal(!!err, true);
                done();
            });
        });

        it('should not error on single file pcap process', function(done) {
            process_pcap.process(file, db, cfg, function(err) {
                assert.equal(!err, true);
                db._db.select('*').from('pcap').row(function(err, row) {
                    console.log(err, row);
                    assert.equal(!err, true);
                    assert.equal(row!=undefined, true);
                    done();
                });
            });
        });
    });
});