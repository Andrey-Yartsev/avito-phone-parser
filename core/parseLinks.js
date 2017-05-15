//var casper = require('casper').create();
var casper = require('casper').create({
  verbose: true,
  logLevel: "debug"
});
var hashCode = require('./lib/hashCode');

function getLinks() {
  var links = document.querySelectorAll('.catalog-list .item-description-title-link');
  return Array.prototype.map.call(links, function(e) {
    return e.getAttribute('href')
  });
}

var base = 'nizhniy_novgorod/transport';
//var pageNumber = 1;
var id = hashCode(base);

casper.start('https://www.avito.ru/' + base, function() {
  casper.then(function() {
    console.log('getLinks');
    var links = casper.evaluate(getLinks);
    require('fs').write('data/links/' + id + '.json', JSON.stringify(links));
    require('child_process').execFile('node', ['linksParsed.js', id], function(error, stdout, stderr) {
      console.log([error, stdout, stderr]);
      console.log('done ' + id);
      casper.exit(0);
    });
  });
  casper.then(function() {
    casper.wait(5000);
  });
});

casper.run();