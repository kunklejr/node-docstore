var fs = require('fs');
var path = require('path');
var events = require('events');
var format = require('./format/json');

function generateKey() {
  return (new Date()).getTime();
}

function getKey(key) {
  return key || generateKey();
}

function getKeyFromFilename(filename) {
  return filename.substring(0, filename.lastIndexOf('.'));
}

function getDocPath(key) {
  return path.join(this.docdir, key + format.extension);
}

function filterFiles(files) {
  var results = [];
  for (var i = 0, l = files.length; i < l; i++) {
    if (files[i].lastIndexOf(format.extension) === files[i].length - format.extension.length) {
      results.push(files[i]);
    }
  }
  return results;
}

var Store = module.exports = function (docdir) {
  this.docdir = docdir;
};

Store.prototype = {
  save: function(key, obj, callback) { // autoassign key if null
    var data = format.stringify(obj);
    var key = getKey(key);
    fs.writeFile(getDocPath.call(this, key), data, function(err) {
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
        callback(null, format.parse(data));
      }
    });
  },

  remove: function(key, callback) {
    // TODO: Should remove return an error if the file didn't exist?
    fs.unlink(getDocPath.call(this, key), callback);
  },

  clear: function(callback) {
    fs.readdir(this.docdir, function(err, files) {
      if (err) {
        return callback(err);
      }

      files = filterFiles(files);
      var length = files.length;
      if (length === 0) {
        return callback(null);
      }

      var unlinked = 0;

      for (var i = 0; i < length; i++) {
        fs.unlink(path.join(this.docdir, files[i]), function(err) {
          if (err) {
            // TODO: Handle situation where files may have been deleted between retrieving directory listeing and unlinking
            return callback(err);
          }
          if (length === ++unlinked) {
            return callback(null);
          }
        });
      }
    }.bind(this));
  },

  scan: function (filter, callback) { // callback is optional, may emit document and end events instead
    if (callback) {
      var results = [];
      var onErr = callback;
      var onDoc = results.push.bind(results);
      var onEnd = callback.bind(this, null, results);
    } else {
      var emitter = new events.EventEmitter();
      var onErr = emitter.emit.bind(emitter, 'error');
      var onDoc = emitter.emit.bind(emitter, 'document');
      var onEnd = emitter.emit.bind(emitter, 'end');
    }

    fs.readdir(this.docdir, function(err, files) {
      if (err) {
        return onErr(err);
      }

      files = filterFiles(files);
      var length = files.length;
      if (length === 0) {
        return onEnd();
      }

      var read = 0;

      for (var i = 0; i < length; i++) {
        var key = getKeyFromFilename(files[i]);
        this.get(key, function(err, doc) {
          if (err) {
            // TODO: Handle situation where files may have been deleted between retrieving directory listeing and reading
            return onErr(err);
          }

          if (filter(doc)) {
            onDoc(doc);
          }

          if (length === ++read) {
            onEnd();
          }
        });
      }
    }.bind(this));

    return callback ? undefined : emitter;
  },

  all: function (callback) { // callback is optional, may emit document and end events instead
    return this.scan.bind(this, function() { return true; }).apply(this, arguments);
  }
};
