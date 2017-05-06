var exec = require('child_process').exec;
var fs = require('fs');

var id = process.argv[2];
var data = require('fs').readFileSync('data/one/' + id);
data = JSON.parse(data);

var saveBase64 = function(id, base64image, callback) {
  var path = 'data/image/' + id + '.png';
  fs.writeFileSync(path, new Buffer(base64image, 'base64'));
  return path;
};

// ...

require('./lib/db')(function(models) {
  var path = saveBase64(id, data.image);
  exec('tesseract ' + path + ' data/phone/' + id, function(err, err2, output) {
    if (err) throw new Error(err);
    if (err2) throw new Error(err2);
    var phone = fs.readFileSync('data/phone/' + id + '.txt'). //
    toString().trim().replace(/[\s—\-]*/g, '');
    models.one.create({
      id: id,
      phone: phone
    });
    console.log('Stored ' + phone);
    process.exit(0);
  });
});

