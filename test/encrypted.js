var expect = require('chai').expect;
var Encrypted = require('../lib/format/encrypted');

var format = {
  extension: '.json',
  stringify: function(json) { return JSON.stringify(json); },
  parse: function(buffer) { return JSON.parse(buffer); }
};

describe('format/encrypted', function() {
  it('should add .enc to the file extension of the underlying format', function(done) {
    var encrypted = new Encrypted('aes128', 'password', format);
    expect(encrypted.extension).to.equal('.json.enc');
    done();
  });

  it('should encrypt and decrypt properly', function(done) {
    var encrypted = new Encrypted('aes128', 'password', format);
    var orig = { success: true };
    var enc = encrypted.stringify(orig);
    var plain = encrypted.parse(enc);
    expect(plain.success).to.equal(orig.success);
    done();
  });
});
