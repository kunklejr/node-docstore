var sf = require('sf');
var expect = require('chai').expect;
var keygen = require('../lib/keygen');

describe('keygen', function() {
  describe('random', function() {
    it('should generate a random string containing only digits', function(done) {
      var key = keygen.random();
      expect(key).to.match(/\d+/);
      done();
    });

    it('should not generate duplicate keys', function(done) {
      var keys = [];
      for (var i = 0; i < 100; i++) {
        var key = keygen.random();
        expect(keys).to.not.include(key);
        keys.push(key);
      }
      done();
    });
  });

  describe('dateTime', function() {
    it('should generate a date with the pattern yyyyMMddHHmmss', function(done) {
      var now = new Date();
      var key = keygen.dateTime();
      expect(key).to.equal(sf('{0:yyyyMMddHHmmss}', now));
      done();
    });
  });

  describe('utcDateTime', function() {
    it('should generate a UTC date with the pattern yyyyMMddHHmmss');
  });
});
