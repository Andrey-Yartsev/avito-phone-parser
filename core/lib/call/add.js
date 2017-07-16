const call = require('./call');
const log = require('../log');
const scheduleMatch = ('./lib/call/schedule/match');


module.exports = function (models, wsConnection, sourceHash) {
  return async function () {
    if (!scheduleMatch(new Date())) {
      return true;
    }
    const items = await models.item.find({
      sourceHash,
      phone: {$ne: undefined},
      lastCallDt: null
    }).limit(1).exec();
    if (!items.length) {
      log.info('nothing to call');
      return false;
    }
    let item = items[0];
    call(item._id, models, wsConnection, () => {
      log.info('call sent');
    });
    return true;
  }
};