module.exports = (sourceHash, wsConnection) => {
  wsConnection.emit('changed', {
    type: 'notice',
    message: 'Начинаю обзвон ' + sourceHash
  });
  wsConnection.emit('changed', 'source');
  require('./process')(sourceHash).start(wsConnection);
  require('./recallProcess')(sourceHash).start();
};
