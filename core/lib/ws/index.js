const socketIo = require('socket.io');
module.exports = function(wsServer, models) {
  const io = socketIo(wsServer.listener);
  io.on('connection', function(socket) {
    socket.on('changed', function (p1) {
      io.emit('changed');
      console.log('changed');
    });
  });
  return {
    notify: function (type, data) {
      io.emit('event', Object.assign({type}, data));
    }
  };
};
