// CASPER

var casper = require('casper').create({
  // verbose: true,
  // logLevel: "debug"
});

if (!casper.cli.args.length) {
  console.log('Syntax: casperjs parseOne.js ID avito/item/link');
  casper.exit(1);
}
var id = casper.cli.args[0];
var page = casper.cli.args[1];
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
    require('fs').write('data/one/' + id, data);
    console.log('Running', 'node', 'oneParsed.js', id);
    require('child_process').execFile('node', ['oneParsed.js', id], null, function(error, stdout, stderr) {
      console.log(stdout);
      casper.exit(0);
    });
  });
  casper.then(function() {
    casper.wait(5000);
  });
});

casper.run();
