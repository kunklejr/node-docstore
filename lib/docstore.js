var fs = require('fs');
var Store = require('./store');

function onOpen(docdir, options, callback) {
  if (!callback) {
    callback = options;
  }
  var store = new Store(docdir, options);
  callback(undefined, store);
}

exports.open = function (docdir, callback) {
  fs.stat(docdir, function(err, stat) {
    if (err) {
      fs.mkdir(docdir, function(err) {
        err ? callback(err) : onOpen(docdir, callback);
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

