var assert = require('chai').assert;
var process_sqlite = require('../lib/process_sqlite');

describe('process_sqlite', function() {

    describe('#process()', function() {
        it('should return Error', function(done) {
            process_sqlite.process('foo', undefined, function(err) {
                assert.equal(err!=undefined, true);
                done();
            });
        });
    });

});