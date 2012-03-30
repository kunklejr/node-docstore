var crypto = require('crypto');

var Encrypted = module.exports = function(algorithm, password, underlyingFormat) {
  this.algorithm = algorithm;
  this.password = password;
  this.underlyingFormat = underlyingFormat;
  this.extension = underlyingFormat.extension + '.enc';
};

Encrypted.prototype.serialize = function (json) {
  var cipher = crypto.createCipher(this.algorithm, this.password);
  var plainText = this.underlyingFormat.serialize(json);
  return cipher.update(plainText, 'utf8', 'binary') + cipher.final('binary');
};

Encrypted.prototype.deserialize = function(buffer) {
  var decipher = crypto.createDecipher(this.algorithm, this.password);
  var plainText = decipher.update(buffer, 'binary', 'utf8') + decipher.final('utf8');
  return this.underlyingFormat.deserialize(plainText);
};

