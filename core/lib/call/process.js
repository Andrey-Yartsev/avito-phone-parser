const spawn = require('child_process').spawn;
const fs = require('fs');

module.exports = (sourceHash) => {
  const script = 'caller.js';
  const dataFolder = './data/process/caller';
  return {
    init: () => {
      fs.writeFileSync(dataFolder + '/' + sourceHash, process.pid);
    },
    start: (wsConnection) => {
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
      // child.stderr.on('data', function (data) {
      //   console.log('stderr: ' + data);
      // });
      // child.on('close', function (code) {
      //   console.log('child process exited with code ' + code);
      // });
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
    }
  }
};
