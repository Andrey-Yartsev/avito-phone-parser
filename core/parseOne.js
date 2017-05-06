// CASPER

var casper = require('casper').create({
  // verbose: true,
  // logLevel: "debug"
});

var hashCode = function(s) {
  var hash = 0, i, chr;
  if (s.length === 0) return 'id' + hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return 'id' + hash;
};


if (!casper.cli.args.length) {
  console.log('Syntax: casperjs parseOne.js some/path');
  casper.exit(1);
}
var page = casper.cli.args[0];
if (page.charAt(0) === '/') {
  page = page.substr(1);
}

casper.start('https://www.avito.ru/' + page, function() {
  casper.then(function() {
    this.click('.item-phone-number button');
  });
  casper.then(function() {
    casper.wait(1000);
  });
  casper.then(function() {
    var base64Data = casper.getElementAttribute('.item-phone-number button img', 'src');
    base64Data = base64Data.replace(/^data:image\/png;base64,/, "");
    var data = JSON.stringify({
      image: base64Data
    });
    var id = hashCode(data);
    require('fs').write('data/one/' + id, data);
    require('child_process').exec('node', ['oneParsed.js', id], function(error, stdout, stderr) {
      console.log('done');
    });
  });
  casper.then(function() {
    casper.wait(1000);
  });
});

casper.run();
