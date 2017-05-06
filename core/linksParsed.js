if (!process.argv[2]) {
  console.log('Syntax: node ' + __filename.replace(/\/(.*)/, '$1') + ' pageId');
  process.exit(1);
}

const id = process.argv[2];
const hashCode = require('./lib/hashCode');
let links = require('fs').readFileSync('data/links/' + id + '.json');
links = JSON.parse(links.toString());

console.log('Saving ' + links.length + ' links');

const saveMany = require('./lib/db/saveMany');
require('./lib/db')(function(models) {
  let docs = [];
  for (let i = 0; i < links.length; i++) {
    docs.push({
      id: hashCode(links[i]),
      url: links[i]
    });
  }
  saveMany(models.one, docs, function() {
    console.log('Stored ' + links.length + ' links to models.one');
    process.exit(0);
  });
});
