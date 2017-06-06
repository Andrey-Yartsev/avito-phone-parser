const wsClient = require("socket.io-client");
const wsConnection = wsClient.connect("http://localhost:3050/");


const call = require('./lib/utils/call');

const maxRetries = 3;
const retryInterval = 5; // minutes

require('./lib/db')(function (models) {

  const tick = () => {
    models.item.find({
      callStatus: 'calling'
    }).exec((err, items) => {
      for (let item of items) {
        let minutes = Math.round((new Date() - new Date(item.lastCallDt)) / 1000 / 60);
        console.log(minutes + ' > ' + retryInterval);
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

  tick();
  setInterval(tick, 5000);

});


