var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;
var Store = require('../lib/store');
var jsonFormat = require('../lib/format/json');
var docdir = path.join(__dirname, '..', 'tmp');

describe('store', function () {
  before(function () {
    try {
      var stat = fs.statSync(docdir);
      var files = fs.readdirSync(docdir);
      files.forEach(function (file) {
        if (file.indexOf('.json') > -1) {
          fs.unlinkSync(path.join(docdir, file));
        }
      });
    } catch (e) {
      fs.mkdirSync(docdir);
    }
  });

  describe('#new', function() {
    it('should default the format to json if none is provided in the options', function(done) {
      var store = new Store(docdir);
      expect(store.format).to.equal(jsonFormat);
      store = new Store(docdir, { bogus: true });
      expect(store.format).to.equal(jsonFormat);
      done();
    });

    it('should use the format specified in the options', function(done) {
      var format = {
        extension: '.test',
        serialize: function(json) {
          return '1';
        },
        deserialize: function(str) {
          return { ret: str.toString() };
        }
      };

      var store = new Store(docdir, { format: format });
      expect(store.format).to.equal(format);

      store.save({}, function(err, obj) {
        store.get(obj.key, function(err, obj) {
          expect(obj.ret).to.equal('1');
          done();
        });
      });
    });
  });

  describe('#save', function() {
    it('should generate a key value if not provided one', function (done) {
      var store = new Store(docdir);
      store.save({ create: true }, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj.key).to.exist;
        done();
      });
    });

    it('should use the given key if provided one', function(done) {
      var store = new Store(docdir);
      var randKey = Math.random().toString().replace('.', '');
      var obj = { create :true, key: randKey };
      store.save(obj, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj.key).to.equal(randKey);
        done();
      });
    });

    it('should create a new json file if an existing one does not exist', function(done) {
      var store = new Store(docdir);
      store.save({ create: true }, function(err, obj) {
        expect(err).to.not.exist;
        fs.stat(path.join(docdir, obj.key + '.json'), function(err, stat) {
          expect(err).to.not.exist;
          expect(stat.isFile()).to.be.true;
          done();
        });
      });
    });

    it('should overwrite an existing json file', function(done) {
      var store = new Store(docdir);
      store.save({ create: true }, function(err, obj) {
        expect(err).to.not.exist;
        obj.create = false;
        store.save(obj, function(err, secondObj) {
          expect(err).to.not.exist;
          expect(secondObj.key).to.equal(obj.key);
          var str = fs.readFileSync(path.join(docdir, obj.key + '.json'));
          var json = JSON.parse(str);
          expect(json.create).to.be.false;
          done();
        });
      });
    });
  });

  describe('#get', function() {
    it('should invoke callback with JSON structure if key exists', function(done) {
      var store = new Store(docdir);
      store.save({ success: true }, function(err, obj) {
        store.get(obj.key, function(err, obj) {
          expect(err).to.not.exist;
          expect(obj).to.exist;
          expect(obj.success).to.be.true;
          done();
        });
      });
    });

    it('should invoke callback with error if key does not exist', function(done) {
      var store = new Store(docdir);
      store.save({ success: true }, function(err, obj) {
        store.get(obj.key + 'asdf', function(err, obj) {
          expect(err).to.exist;
          expect(obj).to.not.exist;
          done();
        });
      });
    });

    it('should always set the key to match the filename, regardless of key value on disk', function(done) {
      var key = Math.random();
      var doc = JSON.stringify({ key: 'invalid', success: true });
      fs.writeFileSync(path.join(docdir, key + '.json'), doc);

      var store = new Store(docdir);
      store.get(key, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj.key).to.equal(key);
        expect(obj.success).to.be.true;
        done();
      });
    });
  });

  describe('#remove', function() {
    it('should invoke callback with no args if remove succeeds', function(done) {
      var store = new Store(docdir);
      store.save({ success: true }, function(err, obj) {
        store.remove(obj.key, function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    it('should invoke callback with an error if remove fails', function(done) {
      var store = new Store(docdir);
      store.remove('bogus key', function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('#clear', function() {
    it('should invoke callback with no args if clear removes all files', function(done) {
      var store = new Store(docdir);
      store.save({ success: true }, function(err, obj) {
        expect(err).to.not.exist;
        fs.readdir(docdir, function(err, files) {
          expect(err).to.not.exist;
          expect(files).to.not.be.empty;
          store.clear(function(err) {
            expect(err).to.not.exist;
            fs.readdir(docdir, function(err, files) {
              expect(err).to.not.exist;
              var files = files.filter(function(f) {
                return f.lastIndexOf(store.format.extension) > -1;
              });
              expect(files).to.be.empty;
              done();
            });
          });
        });
      });
    });

    it('should invoke callback with no args if clear has no files to remove', function(done) {
      var store = new Store(docdir);
      store.clear(function(err) {
        expect(err).to.not.exist;
        store.clear(function(err) {
          expect(err).to.not.exist;
          fs.readdir(docdir, function(err, files) {
            expect(err).to.not.exist;
            var files = files.filter(function(f) {
              return f.lastIndexOf(store.format.extension) > -1;
            });
            expect(files).to.be.empty;
            done();
          });
        });
      });
    });

    it('should invoke callback with an error if clear fails');
  });

  describe('#scan', function() {
    describe('with a callback argument', function() {
      it('should invoke the callback with all files that return true from the filter function', function(done) {
        var store = new Store(path.join(__dirname, 'documents', 'scan'));
        var filter = function(doc) {
          return doc.filter === true;
        };
        store.scan(filter, function(err, docs) {
          expect(err).to.not.exist;
          expect(docs).to.exist;
          expect(docs).to.have.length(2);
          done();
        });
      });

      it('should invoke the callback with an empty array of files if none are filtered', function(done) {
        var store = new Store(path.join(__dirname, 'documents', 'scan'));
        var filter = function(doc) {
          return doc.filter === 7;
        };
        store.scan(filter, function(err, docs) {
          expect(err).to.not.exist;
          expect(docs).to.exist;
          expect(docs).to.be.empty;
          done();
        });
      });

      it('should invoke the callback with an empty array if no files exist', function(done) {
        var store = new Store(path.join(__dirname, 'documents', 'empty'));
        var filter = function(doc) {
          return doc.filter === 7;
        };
        store.scan(filter, function(err, docs) {
          expect(err).to.not.exist;
          expect(docs).to.exist;
          expect(docs).to.be.empty;
          done();
        });
      });
    });

    describe('using the document stream', function() {
      it('should emit a document event for all docs that return true from the filter function', function(done) {
        var store = new Store(path.join(__dirname, 'documents', 'scan'));
        var filter = function(doc) {
          return doc.filter === true;
        };
        var stream = store.scan(filter);
        stream.on('document', function(doc) {
          expect(doc.filter).to.be.true;
        });
        stream.on('error', function(doc) {
          throw new Error('error event should not be emitted');
        });
        stream.on('end', done);
      });

      it('should emit only the end event if none are filtered', function(done) {
        var store = new Store(path.join(__dirname, 'documents', 'scan'));
        var filter = function(doc) {
          return doc.filter === 7;
        };
        var stream = store.scan(filter);
        stream.on('document', function(doc) {
          throw new Error('document event should not be emitted');
        });
        stream.on('error', function(doc) {
          throw new Error('error event should not be emitted');
        });
        stream.on('end', done);
      });

      it('should emit only the end event if no files exist', function(done) {
        var store = new Store(path.join(__dirname, 'documents', 'empty'));
        var filter = function(doc) {
          return doc.filter === 7;
        };
        var stream = store.scan(filter);
        stream.on('document', function(doc) {
          throw new Error('document event should not be emitted');
        });
        stream.on('error', function(doc) {
          throw new Error('error event should not be emitted');
        });
        stream.on('end', done);
      });

      it('should emit an error event on any failure');
    });
  });

  describe('#all', function() {
    describe('with a callback argument', function() {
      it('should invoke the callback with all files', function(done) {
        var store = new Store(path.join(__dirname, 'documents', 'scan'));
        store.all(function(err, docs) {
          expect(err).to.not.exist;
          expect(docs).to.exist;
          expect(docs).to.have.length(3);
          done();
        });
      });

      it('should invoke the callback with an empty array if no files are found', function(done) {
        var store = new Store(path.join(__dirname, 'documents', 'empty'));
        store.all(function(err, docs) {
          expect(err).to.not.exist;
          expect(docs).to.exist;
          expect(docs).to.be.empty;
          done();
        });
      });
    });

    describe('using the stream', function() {
      it('should emit the document event for all files', function(done) {
        var store = new Store(path.join(__dirname, 'documents', 'scan'));
        var stream = store.all();
        var count = 0;
        stream.on('document', function(doc) {
          ++count;
        });
        stream.on('error', function(doc) {
          throw new Error('error event should not be emitted');
        });
        stream.on('end', function() {
          expect(count).to.equal(3);
          done();
        });
      });

      it('should emit only the end event if no files are found', function(done) {
        var store = new Store(path.join(__dirname, 'documents', 'empty'));
        var stream = store.all();
        stream.on('document', function(doc) {
          throw new Error('document event should not be emitted');
        });
        stream.on('error', function(doc) {
          throw new Error('error event should not be emitted');
        });
        stream.on('end', done);
      });

      it('should emit an error event on any failure');
    });
  });
});

