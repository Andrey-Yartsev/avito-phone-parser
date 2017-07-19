const log = require('./lib/log');
if (!process.argv[2]) {
  log.error('Syntax: node caller.js {sourceHash}');
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
      log.info(r);
      process.exit(1);
    });
  });
} else {
  const wsClient = require("socket.io-client");
  const wsConnection = wsClient.connect("http://localhost:3050/");
  const AddCall = require('./lib/call/add');
  const callProcess = require('./lib/call/process')(sourceHash);

  require('./lib/db')(async function (models) {
    const addCall = AddCall(models, wsConnection, sourceHash);
    callProcess.init();
    setTimeout(() => {
      wsConnection.emit('changed', 'source');
    }, 500);
    log.info('adding call');
    addCall().then(async (callAdded) => {
      log.info('add call result: ' + (callAdded ? 'added' : 'schedule not match'));
      if (!callAdded) {
        log.info('nothing to call 2');
        wsConnection.emit('changed', 'source');
        wsConnection.emit('changed', {
          type: 'notice',
          message: 'Завершаю обзвон ' + sourceHash
        });
        log.info(`finish calling on ${sourceHash}`);
        await models.source.update({hash: sourceHash}, {$set: {callingComplete: true}});
      }
      setInterval(addCall, 60000);
    }).catch((e) => {
      log.error(e);
    });
  });
}
