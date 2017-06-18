const call = require('./call');

module.exports = function(models, wsConnection, sourceHash) {
  return function() {
    models.item.find({
      sourceHash,
      phone: {$ne:undefined},
      lastCallDt: null
    }).limit(1).exec((err, items) => {
      if (!items.length) {
        console.log('nothing to call');
        return;
      }
      let item = items[0];
      call(item._id, models, wsConnection, () => {
        console.log('call sent');
      });
    });
  }
};