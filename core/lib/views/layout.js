const header = require('./header');
const footer = `</div></body></html>`;

module.exports = (body) => {
  return header + body + footer;
};