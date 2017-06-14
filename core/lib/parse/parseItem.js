const exec = require('child_process').exec;

module.exports = (wsConnection, models, item, callback) => {

  const finish = (item, callback) => {
    models.item.updateOne({_id: item._id}, {
      $set: {
        parsing: false,
        parseDt: new Date()
      }
    }, function () {
      callback(item);
    });
  };



  let attempt = 0;
  const maxAttempts = 3;

  const parseItem = () => {
    if (attempt) console.log('Attempt ' + (attempt + 1));
    //console.log('pkill firefox');
    exec('pkill firefox', (err, stdout, stderr) => {
      // total: parsing: parsed: parsedPerMinute:
      models.item.update({_id: item._id}, {
        $set: {
          parsing: true
        }
      }, function () {
        wsConnection.emit('changed', 'item');
        item.url = item.url.replace(/^\/(.*)/, '$1');
        const parseOneCmd = 'URI=' + item.url + ' ID=' + item._id + ' node parseItem.js';
        console.log(parseOneCmd);
        exec(parseOneCmd, function (error, stdout, stderr) {
          if (error) {
            console.log(stdout);
            if (error.code === 13) {
              attempt++;
              if (attempt === maxAttempts) {
                finish(item, () => {
                  wsConnection.emit('changed', 'item');
                  callback();
                });
                return;
              }
              parseItem();
            }
            return;
          }
          attempt = 0;
          console.log(stdout.trim());
          finish(item, (item) => {
            let cmd = 'node extractPhone.js ' + item._id;
            console.log(cmd);
            exec(cmd, (err, stdout, stderr) => {
              wsConnection.emit('changed', 'item');
              console.log(stdout.trim());
              callback();
            });
          });
        });
      });
    });
  };
  return parseItem;
};
