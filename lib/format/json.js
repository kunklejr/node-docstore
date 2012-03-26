exports.extension = '.json';

exports.stringify = function (obj) {
  return JSON.stringify(obj);
};

exports.parse = function (str) {
  return JSON.parse(str);
};
