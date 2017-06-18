if (!process.argv[2]) {
  console.log('Syntax: node caller.js {sourceHash}');
  return;
}
const sourceHash = process.argv[2];

if (process.argv[3] === 'reset') {
  require('./lib/db')(function (models) {
    models.item.update({
      sourceHash
    }, {
      lastCallDt: null
    }, (err, r) => {
      console.log(r);
      process.exit(1);
    });
  });
} else {
  const wsClient = require("socket.io-client");
  const wsConnection = wsClient.connect("http://localhost:3050/");
  const AddCall = require('./lib/call/add');

  const callProcess = require('./lib/call/process')(sourceHash);

  require('./lib/db')(function (models) {
    const addCall = AddCall(models, wsConnection, sourceHash);
    callProcess.init();
    addCall();
    setInterval(addCall, 60000);
  });
}


