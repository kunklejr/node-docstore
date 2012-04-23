var fs = require('fs');
var path = require('path');
var events = require('events');
var util = require('util');
var jsonFormat = require('./format/json');
var keygen = require('./keygen');

function getKeyFromFilename(filename) {
  return filename.substring(0, filename.lastIndexOf('.'));
}

function getDocPath(key) {
  return path.join(this.docdir, key + this.format.extension);
}

function filterFiles(files) {
  var results = [];
  for (var i = 0, l = files.length; i < l; i++) {
    if (files[i].lastIndexOf(this.format.extension) === files[i].length - this.format.extension.length) {
      results.push(files[i]);
    }
  }
  return results;
}

var Store = module.exports = function (docdir, options) {
  options = options || {};
  this.docdir = docdir;
  this.format = options.format || jsonFormat;
  this.generateKey = options.keygen || keygen.random;
};

Store.prototype.save = function (obj, callback) { // autoassign key if null
  obj.key = obj.key || this.generateKey();
  var data = this.format.serialize(obj);
  var docPath = getDocPath.call(this, obj.key);
  fs.writeFile(docPath, data, function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, obj);
  }.bind(this));
};

Store.prototype.get = function (key, callback) {
  var docPath = getDocPath.call(this, key);
  fs.readFile(docPath, function(err, data) {
    if (err) {
      return callback(err);
    }
    var obj = this.format.deserialize(data);
    obj.key = key;
    callback(null, obj);
  }.bind(this));
};

Store.prototype.remove = function (key, callback) {
  // TODO: Should remove return an error if the file didn't exist?
  var docPath = getDocPath.call(this, key);
  fs.unlink(docPath, function(err) {
    if (err) {
      return callback(err);
    }
    callback(null);
  }.bind(this));
};

Store.prototype.clear = function (callback) {
  fs.readdir(this.docdir, function(err, files) {
    if (err) {
      return callback(err);
    }

    files = filterFiles.call(this, files);
    var length = files.length;
    if (length === 0) {
      return callback(null);
    }

    var unlinked = 0;

    for (var i = 0; i < length; i++) {
      var key = getKeyFromFilename(files[i]);
      this.remove(key, function(err) {
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
};

Store.prototype.scan = function (filter, callback) { // callback is optional, may emit document and end events instead
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

    files = filterFiles.call(this, files);
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
};

Store.prototype.all = function (callback) { // callback is optional, may emit document and end events instead
  return this.scan.bind(this, function() { return true; }).apply(this, arguments);
};
