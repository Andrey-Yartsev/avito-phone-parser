const call = require('./call');

module.exports = (wsConnection, models) => {
  const maxRetries = 3;
  const retryInterval = 5; // minutes

  models.item.find({
    callStatus: 'calling'
  }).exec((err, items) => {
    for (let item of items) {
      let minutes = Math.round((new Date() - new Date(item.lastCallDt)) / 1000 / 60);
      if (minutes >= retryInterval) {
        if (item.retries === maxRetries) {
          console.log(`maxRetries reached for ${item._id}, ${item.phone}`);
          models.item.updateOne({_id: item._id}, {
            $set: {callStatus: 'maxRetriesReached'}
          }, () => {
            wsConnection.emit('changed', 'item');
          });
        } else {
          let retry = item.retries + 1;
          models.item.updateOne({_id: item._id}, {$set: {retries: retry}}, () => {
            console.log(`attempt ${retry} for ${item._id}, ${item.phone}`);
            call(item._id, models, wsConnection, () => {
              console.log('call sent');
            });
          });
        }
      }
    }
  });
};