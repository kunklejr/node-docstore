var expect = require('chai').expect;
var keygen = require('../lib/keygen');

describe('keygen', function() {
  it('should generate a random string containing only digits', function(done) {
    var key = keygen();
    expect(key).to.match(/\d+/);
    expect(key.length).to.equal(18);
    done();
  });

  it('should not generate duplicate keys', function(done) {
    var keys = [];
    for (var i = 0; i < 100; i++) {
      var key = keygen();
      expect(keys).to.not.include(key);
      expect(key.length).to.equal(18);
      keys.push(key);
    }
    done();
  });
});
