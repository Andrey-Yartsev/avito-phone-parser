if (!process.argv[2]) {
  console.log('Syntax: casperjs addParseOne.js avito/one/page');
  return;
}

var path = process.argv[2];

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

const MAX_PROCESSES = 5;

var getProccessN = function(callback) {
  exec('ps aux | grep parseOne\.js', function(error, stdout, stderr) {
    if (stderr) throw new Error(stderr);
    if (error) throw new Error(error);
    var lines = stdout.trim().split("\n");
    lines = lines.filter(function(v) {
      return v.match('casper');
    });
    callback(lines.length);
  });
};

getProccessN(function(n) {
  if (n < MAX_PROCESSES) {
    console.log('Current core processes count: ' + n + '. Adding one more...');
    spawn('casperjs', ['parseOne.js', path], {
      detached: true
    });
    process.exit(0);
  } else {
    console.log('Current core processes count: ' + n + '. Max number');
  }
});
