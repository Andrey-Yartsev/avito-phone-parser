const call = require('./call');
const log = require('../log');

module.exports = function(models, wsConnection, sourceHash) {
  return function() {
    models.item.find({
      sourceHash,
      phone: {$ne:undefined},
      lastCallDt: null
    }).limit(1).exec((err, items) => {
      if (!items.length) {
        log.info(`nothing to call on ${sourceHash}`);
        return;
      }
      let item = items[0];
      call(item._id, models, wsConnection, () => {
        log.info('call sent');
      });
    });
  }
};