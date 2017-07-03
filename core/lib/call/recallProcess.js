module.exports = (sourceHash) => {
  return require('../process')('./data/process/recall', 'recall.js', sourceHash);
};
