const spawn = require('child_process').spawn;
const fs = require('fs');
const log = require('../log');

module.exports = (sourceHash) => {
  const script = 'caller.js';
  const dataFolder = './data/process/caller';
  return {
    init: () => {
      fs.writeFileSync(dataFolder + '/' + sourceHash, process.pid);
    },
    start: (wsConnection) => {
      log.info('starting ' + script);
      const child = spawn('node', [script, sourceHash], {
        detached: true
      });
      child.stdout.on('data', function (s) {
        const out = s.toString().trim();
        if (out === 'nothing to call') {
          wsConnection.emit('changed', {
            type: 'notice',
            text: 'Некуда звонить'
          });
        }
      });
      child.on('close', function (code) {
        log.info(`Process ${script} ${sourceHash} has stopped` + (code ? `with code ${code}` : ''));
      });
    },
    stop: () => {
      log.info('stopping ' + script);
      const pid = fs.readFileSync(dataFolder + '/' + sourceHash);
      fs.unlinkSync(dataFolder + '/' + sourceHash);
      spawn('kill', [pid], {
        detached: true
      });
    },
    inProgress: () => {
      return fs.existsSync(dataFolder + '/' + sourceHash);
    }
  }
};
