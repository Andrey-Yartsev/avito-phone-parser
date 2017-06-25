module.exports = (sourceHash) => {
  return require('../process')('./data/process/parseLinks', 'parseLinks.js', sourceHash);
};