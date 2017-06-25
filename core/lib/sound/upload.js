const log = require('../log');

module.exports = {

  handler: (request, reply) => {
    const data = request.payload;
    if (data.file) {
      const name = request.params.hash + '.wav';
      const wavFile = soundsFolder + '/' + name;
      const pm3File = soundsFolder + '/' + request.params.hash + '.mp3';
      if (fs.existsSync(wavFile)) {
        fs.unlinkSync(wavFile);
      }
      const file = fs.createWriteStream(wavFile);
      file.on('error', function (err) {
        log.warn(err);
        reply(err);
      });
      data.file.pipe(file);
      data.file.on('end', function (err) {
        const ret = {
          status: 'success',
          filename: data.file.hapi.filename,
          headers: data.file.hapi.headers
        };
        const gsmFile = soundsAsterFolder + '/' + request.params.hash + '.gsm';
        exec(`sox -V ${wavFile} -r 8000 -c 1 -t gsm ${gsmFile}`, function (err, err2, output) {
          if (err) {
            log.warn(err);
            reply({error: err.code});
            return;
          }
          log.debug(`gsm converted ${wavFile}`);
          exec(`lame -b 32 --resample 8 -a ${wavFile} ${pm3File}`,
            function (err, err2, output) {
              if (err) {
                console.error(err);
                reply({error: err.code});
                return;
              }
              log.debug(`mp3 converted ${wavFile}`);
              reply(ret);
            });
        });
      });
    }
  }


};