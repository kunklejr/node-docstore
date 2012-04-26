module.exports = function() {
  var rand = Math.random().toFixed(18).toString();
  return rand.substring(rand.indexOf('.') + 1);
};
