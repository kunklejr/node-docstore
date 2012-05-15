var fs = require('fs');
var path = require('path');
var events = require('events');
var util = require('util');
var async = require('async');
var jsonFormat = require('./format/json');
var idgen = require('./idgen');

function getIdFromFilename(filename) {
  return filename.substring(0, filename.lastIndexOf('.'));
}

function getDocPath(docdir, format, id) {
  return path.join(docdir, id + format.extension);
}

function filterFiles(files, format) {
  var results = [];
  for (var i = 0, l = files.length; i < l; i++) {
    if (files[i].lastIndexOf(format.extension) === files[i].length - format.extension.length) {
      results.push(files[i]);
    }
  }
  return results;
}

function isDeletedError(err) {
  return err && err.code === 'ENOENT';
}

var Store = module.exports = function (docdir, options) {
  options = options || {};
  this.docdir = docdir;
  this.format = options.format || jsonFormat;
  this.generateId = options.idgen || idgen;
};
util.inherits(Store, events.EventEmitter);

Store.prototype.save = function (obj, callback) { // autoassign id if null
  obj._id = obj._id || this.generateId();
  var data = this.format.serialize(obj);
  var docPath = getDocPath(this.docdir, this.format, obj._id);
  fs.writeFile(docPath, data, function(err) {
    this.emit('save', err, obj);
    callback(err, obj);
  }.bind(this));
};

Store.prototype.get = function (id, callback) {
  var docPath = getDocPath(this.docdir, this.format, id);
  fs.readFile(docPath, function(err, data) {
    if (err) {
      this.emit('get', err, id);
      return callback(err, id);
    }
    var obj = this.format.deserialize(data);
    obj._id = id;
    this.emit('get', undefined, obj);
    callback(undefined, obj);
  }.bind(this));
};

Store.prototype.remove = function (id, callback) {
  var docPath = getDocPath(this.docdir, this.format, id);
  fs.unlink(docPath, function(err) {
    this.emit('remove', err, id);
    callback(err, id);
  }.bind(this));
};

Store.prototype.clear = function (callback) {
  fs.readdir(this.docdir, function(err, files) {
    if (err) {
      return callback(err);
    }

    files = filterFiles(files, this.format);
    async.forEach(files, function(file, done) {
      var id = getIdFromFilename(file);
      this.remove(id, function(err) {
        isDeletedError(err) ? done() : done(err);
      });
    }.bind(this), callback);
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

    files = filterFiles(files, this.format);
    async.forEach(files, function(file, done) {
      var id = getIdFromFilename(file);
      this.get(id, function(err, doc) {
        var deleted = isDeletedError(err);

        if (err && !deleted) {
          return done(err);
        }

        if (!deleted && filter(doc)) {
          onDoc(doc);
        }

        done();
      });
    }.bind(this), function(err) {
      err ? onErr(err) : onEnd();
    });
  }.bind(this));

  return callback ? undefined : emitter;
};

Store.prototype.all = function (callback) { // callback is optional, may emit document and end events instead
  return this.scan.bind(this, function() { return true; }).apply(this, arguments);
};
