const Hapi = require('hapi');
const server = new Hapi.Server();
server.connection({
  port: 8050,
  labels: ['cp']
});
server.connection({
  port: 3050,
  labels: ['ws']
});

const cpServer = server.select('cp');
const wsServer = server.select('ws');

cpServer.route(require('./lib/routes'));

require('./lib/db')(function(models) {
  const ws = require('./lib/ws')(wsServer, models);
  cpServer.decorate('request', 'ws', ws);
  cpServer.decorate('request', 'models', models);
  server.start(function (err) {
    if (err) throw err;
    console.log('Server running on 8050, 3050');
  });
});
