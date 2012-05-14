var fs = require('fs');
var events = require('events');
var Store = require('./store');

var emitter = new events.EventEmitter();

emitter.open = function (docdir, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }

  fs.stat(docdir, function(err, stat) {
    if (err) {
      fs.mkdir(docdir, function(err) {
        err ? callback(err) : onOpen(docdir, options, callback);
      });
    } else {
      if (stat.isDirectory()) {
        onOpen(docdir, options, callback);
      } else {
        var error = new Error(docdir + ' is not a valid doctype directory');
        callback(error);
      }
    }
  });
};

function onOpen(docdir, options, callback) {
  var store = new Store(docdir, options);
  emitter.emit('open', store);
  callback(undefined, store);
}

module.exports = emitter;
