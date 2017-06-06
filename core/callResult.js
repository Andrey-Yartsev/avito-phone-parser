require('dotenv').config();

const id = process.argv[2];
const callStatus = process.argv[3];

let accepted = null;
if (callStatus === 'answered') {
  accepted = parseInt(process.argv[4]) ? true : false;
}

const wsClient = require("socket.io-client");
const wsConnection = wsClient.connect("http://localhost:3050/");
const sendSms = require('./lib/utils/sendSms');

const settings = JSON.parse(require('fs').readFileSync('data/settings.json'));

const emit = () => {
  wsConnection.emit('changed', 'item');
  setTimeout(() => {
    process.exit(0);
  }, 50);
};

require('./lib/db')(function (models) {
  models.item.findOne({_id: id}, (err, item) => {
    if (item.callStatus === 'answered' && callStatus === 'hangup') {
      console.log('Ignore change status to hangup');
      process.exit(0);
      return;
    }
    models.item.updateOne({_id: id}, {
      $set: {
        callStatus,
        accepted,
        resultDt: new Date()
      }
    }, function () {
      console.log('Update ID=' + id + '. callStatus=' + callStatus + '; accepted=' + accepted);
      if (accepted) {
        sendSms(() => {
          sendSms(() => {
            console.log(settings.managerPhone + ':' + settings.managerSmsText + ' ' + item.phone);
            emit();
          }, settings.managerPhone, settings.managerSmsText + ' ' + item.phone);
        }, item.phone, settings.clientSmsText);
      } else {
        emit();
      }
    });
  });
});
