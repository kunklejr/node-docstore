var fs = require('fs');
var path = require('path');
var util = require('util')
var events = require('events');

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

function generateKey() {
  return (new Date()).getTime();
}

function getKey(key) {
  return key || generateKey();
}

function getDocPath(key) {
  return path.join(this.docdir, key + '.json');
}

var Store = function(docdir) {
  this.docdir = docdir;
};
util.inherits(Store, events.EventEmitter);

Store.prototype = {
  save: function(key, obj, callback) { // autoassign key if null
    var json = JSON.stringify(obj);
    var key = getKey(key);
    fs.writeFile(getDocPath.call(this, key), json, function(err) {
      if (err) {
        callback(err);
      } else {
        callback(null, key);
      }
    });
  },

  get: function(key, callback) {
    fs.readFile(getDocPath.call(this, key), function(err, data) {
      if (err) {
        callback(err);
      } else {
        callback(null, JSON.parse(data));
      }
    });
  },

  remove: function(key, callback) {
    fs.unlink(getDocPath.call(this, key), callback);
  },

  clear: function(callback) {
    fs.readdir(this.docdir, function(err, files) {
      if (err) {
        return callback(err);
      }

      var length = files.length;
      if (length === 0) {
        return callback(null);
      }

      for (var i = 0; i < length; i++) {
        fs.unlink(files[i], function(err) {
          if (err) {
            return callback(err);
          }
          if (i === length - 1) {
            return callback(null);
          }
        });
      }
    });
  },

  scan: function (filter, callback) { // callback is optional, may emit document and end events instead
    var self = this;

    fs.readdir(this.docdir, function(err, files) {
      if (err) {
        return callback(err);
      }

      var length = files.length;
      if (length === 0) {
        return callback(null);
      }

      var results = [];
      for (var i = 0; i < length; i++) {
        if (callback) {
          fs.readFile(files[i], function(err, data) {
            if (err) {
              return callback(err);
            }

            var doc = JSON.parse(data);
            if (filter(doc)) {
              results.push(doc);
            }

            if (i === length - 1) {
              callback(null, results);
            }
          });
        } else {
          fs.readFile(files[i], function(err, data) {
            if (err) {
              return self.emit('error', err);
            }

            var doc = JSON.parse(data);
            if (filter(doc)) {
              self.emit('document', doc);
            }

            if (i === length - 1) {
              self.emit('end');
            }
          });
        }
      }
    });
  },

  all: function (callback) {}, // callback is optional, may emit document and end events instead
};

