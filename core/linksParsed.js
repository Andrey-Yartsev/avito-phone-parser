if (!process.argv[2]) {
  console.log('Syntax: node ' + __filename.replace(/\/(.*)/, '$1') + ' pageId');
  process.exit(1);
}

//const wsClient = require("socket.io-client");

const sourceHash = process.argv[2];
const hashCode = require('./lib/hashCode');
let links = require('fs').readFileSync('data/links/' + sourceHash + '.json');
links = JSON.parse(links.toString());
//const connection = wsClient.connect("http://localhost:3050/");

console.log('Saving ' + links.length + ' links');

const saveMany = require('./lib/db/saveMany');
require('./lib/db')(function (models) {
  let docs = [];
  for (let i = 0; i < links.length; i++) {
    docs.push({
      id: hashCode(links[i]),
      sourceHash: sourceHash,
      url: links[i]
    });
  }
  saveMany(models.one, docs, function () {
    models.source.update({hash: sourceHash}, {$set: {updating: false}}).exec(function () {
      console.log('Stored ' + links.length + ' links to models.one');
      //connection.emit('changed');
      process.exit(0);
    });
  });
});
