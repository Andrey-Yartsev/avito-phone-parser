const socketIo = require('socket.io');
module.exports = function(wsServer, models) {
  const io = socketIo(wsServer.listener);
  io.on('connection', function(socket) {
    //socket.join('common');
    io.on('event', function(data) {
      console.log(data);
    });
    io.on('event2', function(data) {
      console.log(data);
    });
  });
  return {
    notify: function (type, data) {
      io.emit('event', Object.assign({type}, data));
    }
  };
};
