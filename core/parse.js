if (!process.argv[2]) {
  console.log('Syntax: node parse.js {sourceHash}');
  return;
}

const addParser = require('./lib/parse/addParser');

const MAX_PROCESSES = 1;
const wsClient = require("socket.io-client");
const wsConnection = wsClient.connect("http://localhost:3050/");

let itemId = null;
let sourceHash = null;

if (!process.argv[2].match(/^id/)) {
  itemId = process.argv[2];
} else {
  sourceHash = process.argv[2];
}

// if (process.argv[3] && process.argv[3] === 'p') {
//   getProcessN((n) => {
//     console.log('Running: ' + n);
//     process.exit(0);
//   });
// }

require('./lib/db')(function (models) {
  if (itemId) {
    addParser(models, {
      _id: itemId
    }, () => {
      process.exit(0);
    });
  } else {
    const parseProcess = require('./lib/parse/process')(sourceHash);
    parseProcess.init();
    let processN = 0;
    setInterval(function () {
      console.log('running ' + parseProcess.getN());
      if (parseProcess.getN() < MAX_PROCESSES) {
        processN = parseProcess.add();
        addParser(sourceHash, wsConnection, models, {
          url: {$ne: null},
          sourceHash,
          parsing: false,
          parseDt: null
        }, () => {
          wsConnection.emit('changed', 'item');
          parseProcess.remove();
        }, () => {
          parseProcess.stop();
        });
      }
    }, 3000);
  }
});
