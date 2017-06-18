module.exports = (sourceHash) => {
  return require('../process')('./data/process/caller', 'caller.js', sourceHash);
};
