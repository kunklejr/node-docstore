var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;
var assert = require('chai').assert;
var ds = require('../lib/docstore');
var docdir = path.join(__dirname, '..', 'tmp');

describe('docstore', function () {
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

  describe('#open', function () {
    it('should create the document directory if it does not exist', function (done) {
      ds.open(docdir, function(err, store) {
        expect(err).to.not.exist;
        expect(store.docdir).to.equal(docdir);
        done();
      });
    });

    it('should open an existing directory', function(done) {
      ds.open(docdir, function(err, store) {
        expect(err).to.not.exist;
        expect(store.docdir).to.equal(docdir);
        done();
      });
    });

    it('should invoke the callback with an error if the provided directory is a file', function(done) {
      var file = path.join(__dirname, __filename);
      ds.open(file, function(err, store) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('#save', function() {
    it('should generate a key value if not provided one', function (done) {
      ds.open(docdir, function(err, store) {
        store.save(null, { create: true }, function(err, key) {
          expect(err).to.not.exist;
          expect(key).to.exist;
          done();
        });
      });
    });

    it('should use the given key if provided one', function(done) {
      ds.open(docdir, function(err, store) {
        var randKey = Math.random().toString().replace('.', '');
        store.save(randKey, { create: true }, function(err, key) {
          expect(err).to.not.exist;
          expect(key).to.equal(randKey);
          done();
        });
      });
    });

    it('should create a new json file if an existing one does not exist', function(done) {
      ds.open(docdir, function(err, store) {
        store.save(null, { create: true }, function(err, key) {
          expect(err).to.not.exist;
          fs.stat(path.join(docdir, key + '.json'), function(err, stat) {
            expect(err).to.not.exist;
            expect(stat.isFile()).to.be.true;
            done();
          });
        });
      });
    });

    it('should overwrite an existing json file', function(done) {
      ds.open(docdir, function(err, store) {
        store.save(null, { create: true }, function(err, key) {
          expect(err).to.not.exist;
          store.save(key, { create: false }, function(err, secondKey) {
            expect(err).to.not.exist;
            expect(secondKey).to.equal(key);
            var str = fs.readFileSync(path.join(docdir, key + '.json'));
            var json = JSON.parse(str);
            expect(json.create).to.be.false;
            done();
          });
        });
      });
    });
  });

  describe('#get', function() {
    it('should invoke callback with JSON structure if key exists', function(done) {
      ds.open(docdir, function(err, store) {
        store.save(null, { success: true }, function(err, key) {
          store.get(key, function(err, obj) {
            expect(err).to.not.exist;
            expect(obj).to.exist;
            expect(obj.success).to.be.true;
            done();
          });
        });
      });
    });

    it('should invoke callback with error if key does not exist', function(done) {
      ds.open(docdir, function(err, store) {
        store.save(null, { success: true }, function(err, key) {
          store.get(key + 'asdf', function(err, obj) {
            expect(err).to.exist;
            expect(obj).to.not.exist;
            done();
          });
        });
      });
    });
  });

  describe('#remove', function() {
    it('should invoke callback with no args if remove succeeds', function(done) {
      ds.open(docdir, function(err, store) {
        store.save(null, { success: true }, function(err, key) {
          store.remove(key, function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });
    });

    it('should invoke callback with an error if remove fails', function(done) {
      ds.open(docdir, function(err, store) {
        store.remove('bogus key', function(err) {
          expect(err).to.exist;
          done();
        });
      });
    });
  });

  describe('#clear', function() {
    it('should invoke callback with no args if clear removes all files', function(done) {
      ds.open(docdir, function(err, store) {
        store.save(null, { success: true }, function(err, key) {
          expect(err).to.not.exist;
          fs.readdir(docdir, function(err, files) {
            expect(err).to.not.exist;
            expect(files).to.not.be.empty;
            store.clear(function(err) {
              expect(err).to.not.exist;
              fs.readdir(docdir, function(err, files) {
                expect(err).to.not.exist;
                expect(files).to.be.empty;
                done();
              });
            });
          });
        });
      });
    });

    it('should invoke callback with no args if clear has no files to remove', function(done) {
      ds.open(docdir, function(err, store) {
        store.clear(function(err) {
          expect(err).to.not.exist;
          store.clear(function(err) {
            expect(err).to.not.exist;
            fs.readdir(docdir, function(err, files) {
              expect(err).to.not.exist;
              expect(files).to.be.empty;
              done();
            });
          });
        });
      });
    });
    it('should invoke callback with an error if clear fails');
  });

});

