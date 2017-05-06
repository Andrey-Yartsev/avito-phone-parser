module.exports = function(s) {
  var hash = 0, i, chr;
  if (s.length === 0) return 'id' + hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return 'id' + hash;
};
