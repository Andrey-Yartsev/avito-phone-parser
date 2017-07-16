module.exports = (sourceHash, wsConnection) => {
  wsConnection.emit('changed', {
    type: 'notice',
    message: 'Заканчиваю обзвон ' + sourceHash
  });

  require('../call/process')(sourceHash).stop();
  require('../call/recallProcess')(sourceHash).stop();
  wsConnection.emit('changed', 'source');
};

