const exec = require('child_process').exec;

module.exports = (id, models, wsConnection, callback) => {
  models.item.updateOne({
    _id: id
  }, {
    callStatus: 'calling',
    lastCallDt: new Date()
  }, function (err) {
    models.item.findOne({
      _id: id
    }).exec(function (err, r) {
      wsConnection.emit('changed', 'item');
      console.log(`calling ${id}, ${r.phone}`);
      exec('sudo php /usr/src/collector/asterisk/call.php ' +
        r.id + ' ' + r.phone + ' ' + r.sourceHash,
        function (err, err2, output) {

        if (err) console.log(err);
        if (err2) console.log(err2);
        callback();
      });
    });
  });

};