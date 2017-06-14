const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const fs = require('fs');
const dataFolder = './data/process/parseItem';

module.exports = (sourceHash) => {
  const getN = () => {
    let n = 0;
    fs.readdirSync(dataFolder).forEach(file => {
      n++;
    });
    return n;
  };
  const cleanup = () => {
    fs.readdirSync(dataFolder).forEach(file => {
      fs.unlinkSync(dataFolder + '/' + file);
    });
  };
  return {
    start: () => {
      spawn('node', ['parse.js', sourceHash], {
        detached: true
      });
    },
    stop: () => {
      cleanup();
    },
    cleanup,
    inProgress: () => {
      let n = 0;
      fs.readdirSync(dataFolder).forEach(file => {
        n++;
      });
      return !!n;
    },
    add: () => {
      let n = getN() + 1;
      fs.writeFileSync(dataFolder + '/' + sourceHash + '_' + n);
      return n;
    },
    getN,
    remove: (n) => {
      fs.unlinkSync(dataFolder + '/' + sourceHash + '_' + n);
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
