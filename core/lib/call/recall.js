const call = require('./call');
const log = require('../log');

module.exports = (wsConnection, models, sourceHash) => {
  const maxRetries = 3;
  const retryInterval = 5; // minutes

  models.item.find({
    sourceHash,
    callStatus: 'calling'
  }).limit(1).exec((err, items) => {
    for (let item of items) {
      let minutes = Math.round((new Date() - new Date(item.lastCallDt)) / 1000 / 60);
      if (minutes >= retryInterval) {
        if (item.retries === maxRetries) {
          log.info(`maxRetries reached for ${item._id}, ${item.phone}`);
          models.item.updateOne({_id: item._id}, {
            $set: {callStatus: 'maxRetriesReached'}
          }, () => {
            wsConnection.emit('changed', 'item');
          });
        } else {
          let retry = item.retries + 1;
          models.item.updateOne({_id: item._id}, {$set: {retries: retry}}, () => {
            log.info(`attempt ${retry} for ${item._id}, ${item.phone}`);
            call(item._id, models, wsConnection, () => {
              log.info('recall sent ' + item._id);
            });
          });
        }
      }
    }
  });
};