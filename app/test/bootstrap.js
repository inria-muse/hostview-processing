// code to be run before and after the mocha tests

before(function(done) {

  // Increase the Mocha timeout so that Sails has enough time to lift.
  this.timeout(5000);

  done();

});

after(function(done) {
  done();
});
