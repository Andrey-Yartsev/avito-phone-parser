const wsClient = require("socket.io-client");
const wsConnection = wsClient.connect("http://localhost:3050/");
const call = require('./lib/utils/call');

require('./lib/db')(function (models) {
  const addCall = function() {
    models.item.find({
      phone: {$ne:undefined},
      lastCallDt: null
    }).limit(1).exec((err, items) => {
      if (!items.length) return;
      let item = items[0];
      call(item._id, models, wsConnection, () => {
         console.log('call sent');
       });
    });
  };
  addCall();
  setInterval(addCall, 60000);
});
