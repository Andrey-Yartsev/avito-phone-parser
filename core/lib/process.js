const spawn = require('child_process').spawn;
const fs = require('fs');

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
      spawn('node', [script, sourceHash], {
        detached: true
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