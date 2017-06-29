const fs = require('fs');
const config = require('./config');

module.exports = (sourceHash) => {
  return {
    existsMp3: () => {

      return fs.existsSync(config.soundsFolder + '/' + sourceHash + '.mp3');
    },
    existsAster: () => {
      return fs.existsSync(config.asterFolder + '/' + sourceHash + '.gsm');
    },
    mp3Path: () => {
      const stat = fs.statSync(config.soundsFolder + '/' + sourceHash + '.mp3');
      return `/i/sound/${sourceHash}.mp3?${stat.mtime}`;
    }
  };
};