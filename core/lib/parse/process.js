module.exports = (sourceHash) => {
  return require('../process')('./data/process/parseItem', 'parse.js', sourceHash);
};
