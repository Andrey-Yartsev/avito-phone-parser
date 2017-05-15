const exec = require('child_process').exec;
const fs = require('fs');
const wsClient = require("socket.io-client");

const id = process.argv[2];
let data = require('fs').readFileSync('data/one/' + id);
data = JSON.parse(data);

const saveBase64 = function(id, base64image, callback) {
  let path = 'data/image/' + id + '.png';
  fs.writeFileSync(path, new Buffer(base64image, 'base64'));
  return path;
};

// ...

require('./lib/db')(function(models) {
  const path = saveBase64(id, data.image);
  exec('tesseract ' + path + ' data/phone/' + id, function(err, err2, output) {
    if (err) throw new Error(err);
    if (err2) throw new Error(err2);
    const phone = fs.readFileSync('data/phone/' + id + '.txt'). //
    toString().trim().replace(/[\s—\-]*/g, '');
    models.one.update({id: id}, {$set: {
      phone: phone
    }}, function() {
      const connection  = wsClient.connect("http://localhost:3050/");
      connection.emit('changed');
      console.log('emited');
      // ...
      console.log('Updated phone ' + phone + ' for ' + id);
      process.exit(0);
    });
  });
});

