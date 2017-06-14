const parseItem = require('./parseItem');

module.exports = (sourceHash, wsConnection, models, filter, callback, onEnd) => {
  models.item.find(filter, function (err, items) {
    if (!items.length) {
      console.log('nothing to parse');
      if (onEnd) onEnd();
      return;
    }
    parseItem(wsConnection, models, items[0], callback)();
  }).limit(1); // max process
};

