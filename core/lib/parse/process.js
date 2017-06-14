const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const fs = require('fs');
const dataFolder = './data/process/parseItem';

module.exports = (sourceHash) => {
  let workers = 0;
  const getN = () => {
    return workers;
  };
  const cleanup = () => {
  };
  return {
    init: () => {
      fs.writeFileSync(dataFolder + '/' + sourceHash, process.pid);
    },
    start: () => {
      spawn('node', ['parse.js', sourceHash], {
        detached: true
      });
    },
    stop: (models) => {
      models.item.updateMany(
        {sourceHash: sourceHash},
        {$set: {parsing: false}}).exec(() => {
        //
        const pid = fs.readFileSync(dataFolder + '/' + sourceHash);
        fs.unlinkSync(dataFolder + '/' + sourceHash);
        spawn('kill', [pid], {
          detached: true
        });
      });
    },
    cleanup,
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


// module.exports = (callback) => {
//   exec('ps aux | grep parse', function (error, stdout, stderr) {
//     if (stderr) throw new Error(stderr);
//     if (error) throw new Error(error);
//     let lines = stdout.trim().split("\n");
//     lines = lines.filter(function (v) {
//       return v.match('parse.js');
//     });
//     if (!lines.length) callback(0);
//     else callback(lines.length / 2);
//   });
// };
