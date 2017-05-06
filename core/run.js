// if (!process.argv[2]) {
//   console.log('Syntax: casperjs addParseOne.js avito/one/page');
//   return;
// }
//
// const path = process.argv[2];
// const spawn = require('child_process').spawn;

const exec = require('child_process').exec;
const MAX_PROCESSES = 5;

const getProccessN = function(callback) {
  exec('ps aux | grep parseOne\.js', function(error, stdout, stderr) {
    if (stderr) throw new Error(stderr);
    if (error) throw new Error(error);
    let lines = stdout.trim().split("\n");
    lines = lines.filter(function(v) {
      return v.match('casper');
    });
    callback(lines.length);
  });
};

const addParser = function(models, callback) {
  models.one.find({
    parsing: false,
    parseDt: null
  }, function(err, links) {
    if (!links.length) return;
    const link = links[0];
    // total: parsing: parsed: parsedPerMinute:
    console.log('Start parsing ' + link.id + ' ' + link.url);
    models.one.update({_id: link._id}, {
      $set: {
        parsing: true
      }
    }, function() {
      exec('casperjs parseOne.js ' + link.id + ' ' + link.url, function(error, stdout, stderr) {
        models.one.update({_id: link._id}, {
          $set: {
            parsing: false,
            parseDt: new Date()
          }
        }, function() {
          console.log('Link ' + link.url + ' parsed');
          if (callback) callback(link);
        });
      });
    });
  }).limit(1); // max process
};

require('./lib/db')(function(models) {
  setInterval(function() {
    // adds parseOne if its max process number less MAX_PROCESSES
    getProccessN(function(n) {
      console.log('.');
      if (n < MAX_PROCESSES) {
        addParser(models);
      }
    });
  }, 1000);
});
