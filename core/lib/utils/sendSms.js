const axios = require('axios');
const urlencode = require('urlencode');

const smscSendCmd = function (reply, cmd, arg) {
  if (!process.env.SMSC_LOGIN) throw new Error('.env.SMSC_LOGIN it node defined');
  if (!process.env.SMSC_PASSWORD) throw new Error('.env.SMSC_PASSWORD it node defined');
  let url = 'http://smsc.ru/sys/' + cmd + '.php?' + //
    'login=' + process.env.SMSC_LOGIN + //
    '&psw=' + process.env.SMSC_PASSWORD + '&charset=utf-8&fmt=3&' + arg;
  axios.get(url).then(function (response) {

    if (!response.data) {
      console.log({error: 'request problem'});
      reply({error: 'request problem'}).code(500);
      return;
    }
    console.log(response.data);
    if (response.data.error) {
      reply(response.data);
      return;
    }
    if (response.data.cnt) {
      reply({success: 1});
    }
  }).catch(function (error) {
    console.log(error);
  });
};

module.exports = function (reply, phone, message) {
  smscSendCmd(reply, "send", "cost=3&phones=" + phone + "&mes=" + urlencode(message) + "&translit=0&id=0&sender=0&time=0");
};