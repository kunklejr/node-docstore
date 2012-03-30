exports.extension = '.json';

exports.serialize = function (obj) {
  return JSON.stringify(obj);
};

exports.deserialize = function (buffer) {
  return JSON.parse(buffer);
};
