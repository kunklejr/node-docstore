exports.extension = '.json';

exports.stringify = function (obj) {
  return JSON.stringify(obj);
};

exports.parse = function (buffer) {
  return JSON.parse(buffer);
};
