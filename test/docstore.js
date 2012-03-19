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
  })

  describe('#open', function () {
    it('should create the document directory if it does not exist', function (done) {
      ds.open(docdir, function(err, store) {
        expect(err).to.not.exist;
        expect(store.docdir).to.equal(docdir);
        done();
      });
    })

    it('should open an existing directory', function(done) {
      ds.open(docdir, function(err, store) {
        expect(err).to.not.exist;
        expect(store.docdir).to.equal(docdir);
        done();
      });
    })

    it('should invoke the callback with an error if the provided directory is a file', function(done) {
      var file = path.join(__dirname, __filename);
      ds.open(file, function(err, store) {
        expect(err).to.exist;
        done();
      });
    })
  })

  describe('#save', function() {
    it('should generate a key value if not provided one', function (done) {
      ds.open(docdir, function(err, store) {
        store.save(null, { create: true }, function(err, key) {
          expect(err).to.not.exist;
          expect(key).to.exist;
          done();
        });
      });
    })

    it('should use the given key if provided one', function(done) {
      ds.open(docdir, function(err, store) {
        var randKey = Math.random().toString().replace('.', '');
        store.save(randKey, { create: true }, function(err, key) {
          expect(err).to.not.exist;
          expect(key).to.equal(randKey);
          done();
        });
      });
    })

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
    })

    it('overwrite an existing json file', function(done) {
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
    })

  })
});

