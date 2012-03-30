var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;
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
});

