var fs = require('fs');
var events = require('events');
var Store = require('./store');
var emitter = new events.EventEmitter();

function onOpen(docdir, options, callback) {
  if (!callback) {
    callback = options;
  }
  var store = new Store(docdir, options);
  callback(null, store);
  emitter.emit('open', store);
}

emitter.open = function (docdir, callback) {
  fs.stat(docdir, function(err, stat) {
    if (err) {
      fs.mkdir(docdir, function(err) {
        if (err) {
          callback(err);
        } else {
          onOpen(docdir, callback);
        }
      });
    } else {
      if (stat.isDirectory()) {
        onOpen(docdir, callback);
      } else {
        var error = new Error(docdir + ' is not a valid doctype directory');
        callback(error);
      }
    }
  });
};

module.exports = emitter;
