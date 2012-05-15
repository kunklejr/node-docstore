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
    err ? fs.mkdir(docdir, onMkdir) : onStatSuccess();

    function onMkdir(err) {
      if (err) {
        emitter.emit('open', err, docdir);
        return callback(err, docdir);
      } else {
        onOpen(docdir, options, callback);
      }
    }

    function onStatSuccess() {
      if (stat.isDirectory()) {
        onOpen(docdir, options, callback);
      } else {
        var error = new Error(docdir + ' is not a directory');
        emitter.emit('open', error, docdir);
        return callback(error, docdir);
      }
    }
  });
};

function onOpen(docdir, options, callback) {
  var store = new Store(docdir, options);
  emitter.emit('open', undefined, store);
  callback(undefined, store);
}

module.exports = emitter;
