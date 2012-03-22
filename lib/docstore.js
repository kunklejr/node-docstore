var fs = require('fs');
var Store = require('./store');

exports.open = function (docdir, callback) {
  fs.stat(docdir, function(err, stat) {
    if (err) {
      fs.mkdir(docdir, function(err) {
        if (err) {
          callback(err);
        } else {
          callback(null, new Store(docdir));
        }
      });
    } else {
      if (stat.isDirectory()) {
        callback(null, new Store(docdir));
      } else {
        var error = new Error(docdir + ' is not a valid doctype directory');
        callback(error);
      }
    }
  });
};

