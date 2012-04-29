var expect = require('chai').expect;
var idgen = require('../lib/idgen');

describe('idgen', function() {
  it('should generate a random string containing only digits', function(done) {
    var id = idgen();
    expect(id).to.match(/\d+/);
    expect(id.length).to.equal(18);
    done();
  });

  it('should not generate duplicate ids', function(done) {
    var ids = [];
    for (var i = 0; i < 100; i++) {
      var id = idgen();
      expect(ids).to.not.include(id);
      expect(id.length).to.equal(18);
      ids.push(id);
    }
    done();
  });
});
