if (!process.argv[2]) {
  console.log('Syntax: node parse.js {sourceHash}');
  return;
}

const sourceHash = process.argv[2];

const getProccessN = function (callback) {
  exec('ps aux | grep parse', function (error, stdout, stderr) {
    if (stderr) throw new Error(stderr);
    if (error) throw new Error(error);
    let lines = stdout.trim().split("\n");
    lines = lines.filter(function (v) {
      return v.match('parse.js');
    });
    if (!lines.length) callback(0);
    else callback(lines.length / 2);
  });
};

const exec = require('child_process').exec;
const MAX_PROCESSES = 1;
const wsClient = require("socket.io-client");
const wsConnection = wsClient.connect("http://localhost:3050/");

let parsersRunning = 0;

const addParser = function (models, callback) {
  parsersRunning++;
  models.item.find({
    url: {$ne: null},
    sourceHash,
    parsing: false,
    parseDt: null
  }, function (err, items) {
    console.log('pkill firefox');
    exec('pkill firefox', (err, stdout, stderr) => {
      if (!items.length) {
        console.log('nothing to parse');
        return;
      }
      const item = items[0];
      // total: parsing: parsed: parsedPerMinute:
      models.item.update({_id: item._id}, {
        $set: {
          parsing: true
        }
      }, function () {
        wsConnection.emit('changed', 'item');
        item.url = item.url.replace(/\/(.*)/, '$1');
        const parseOneCmd = 'URI=' + item.url + ' ID=' + item._id + ' node parseItem.js';
        console.log(parseOneCmd);
        exec(parseOneCmd, function (error, stdout, stderr) {
          console.log(stdout.trim());
          models.item.updateOne({_id: item._id}, {
            $set: {
              parsing: false,
              parseDt: new Date()
            }
          }, function () {
            let cmd = 'node extractPhone.js ' + item._id;
            console.log(cmd);
            exec(cmd, (err, stdout, stderr) => {
              wsConnection.emit('changed', 'item');
              console.log(stdout.trim());
              parsersRunning--;
            });
          });
        });
      });
    });
  }).limit(1); // max process
};

if (process.argv[2] && process.argv[2] === 'p') {
  getProccessN((n) => {
    console.log('Running: ' + n);
    process.exit(0);
  });
}

getProccessN((n) => {
  if (n >= 1) {
    console.error('Can not run more than one parse process at the time');
    process.exit(1);
  }
  require('./lib/db')(function (models) {
    //setInterval(function () {
      if (parsersRunning < MAX_PROCESSES) {
        addParser(models);
      }
    //}, 3000);
  });
});
