if (!process.argv[2]) {
  console.log('Syntax: node ' + __filename.replace(/\/(.*)/, '$1') + ' pageId');
  process.exit(1);
}

var id = process.argv[2];
var links = require('fs').readFileSync('data/links/' + id + '.json');
links = JSON.parse(links.toString());

console.log('Saving ' + links.length + ' links');

var saveMany = require('./lib/db/saveMany');
require('./lib/db')(function(models) {
  var docs = [];
  for (var i = 0; i < links.length; i++) {
    docs.push({
      url: links[i]
    });
  }
  saveMany(models.link, docs, function() {
    console.log('stored ' + links.length + ' links');
    process.exit(0);
  });
});
