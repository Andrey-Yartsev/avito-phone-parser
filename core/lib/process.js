const spawn = require('child_process').spawn;
const fs = require('fs');
const log = require('./log');

module.exports = (dataFolder, script, sourceHash) => {
  let workers = 0;
  const getN = () => {
    return workers;
  };
  return {
    init: () => {
      fs.writeFileSync(dataFolder + '/' + sourceHash, process.pid);
    },
    start: () => {
      log.info('starting ' + script);
      const exists = fs.existsSync(dataFolder + '/' + sourceHash);
      if (exists) {
        throw new Error('Can not start unstopped process');
      }
      const child = spawn('node', [script, sourceHash], {
        detached: true
      });
      // child.stderr.on('data', function (data) {
      //   log.warn(data.toString());
      // });
      child.on('close', function (code) {
        log.info(`Process ${script} ${sourceHash} has stopped` + (code ? `with code ${code}` : ''));
      });
    },
    stop: () => {
      const pid = fs.readFileSync(dataFolder + '/' + sourceHash);
      fs.unlinkSync(dataFolder + '/' + sourceHash);
      spawn('kill', [pid], {
        detached: true
      });
    },
    inProgress: () => {
      return fs.existsSync(dataFolder + '/' + sourceHash);
    },
    add: () => {
      workers++;
      return workers;
    },
    getN,
    remove: () => {
      workers--;
    }
  }
};