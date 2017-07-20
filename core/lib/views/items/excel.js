const prepare = require('./prepare');
const header = require('./header');

module.exports = async function (models, filter) {
  const keys = Object.keys(header);
  const items = await models.item.find(filter, keys).exec();
  const rows = [];
  for (item of items) {
    delete item._id;
    let row = [];
    for (let key of keys) {
      row.push(item[key] === undefined ? '' : item[key]);
    }
    rows.push(row);
  }
  // ..... write excel, return binary
};

