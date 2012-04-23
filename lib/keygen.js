exports.random = function() {
  var rand = Math.random().toString();
  return rand.substring(rand.indexOf('.') + 1);
};

exports.dateTime = function() {
  var dt = new Date();
  return '' +
    dt.getFullYear() +
    lpad(dt.getMonth() + 1) +
    lpad(dt.getDate()) +
    lpad(dt.getHours()) +
    lpad(dt.getMinutes()) +
    lpad(dt.getSeconds());
};

exports.utcDateTime = function() {
  var dt = new Date();
  return '' +
    dt.getUTCFullYear() +
    lpad(dt.getUTCMonth() + 1) +
    lpad(dt.getUTCDate()) +
    lpad(dt.getUTCHours()) +
    lpad(dt.getUTCMinutes()) +
    lpad(dt.getUTCSeconds());
};

function lpad(num) {
  var str = num.toString();
  if (str.length < 2) {
    return '0' + str;
  }
  return str;
}
