const Hapi = require('hapi');
const Inert = require('inert');
const server = new Hapi.Server();
const log = require('./lib/log');

server.connection({
  port: 8050,
  labels: ['cp']
});
server.connection({
  port: 3050,
  labels: ['ws']
});
server.register(Inert, () => {
});

const cpServer = server.select('cp');
const wsServer = server.select('ws');

cpServer.on('request-error', function (request, err) {
  log.warn('Error response (500) sent for URL: ' +
    request.url.path + ' because: ' +
    (err.trace || err.stack || err));
});

cpServer.route(require('./lib/routes'));

require('./lib/db')(function (models) {
  const ws = require('./lib/ws')(wsServer, models);
  cpServer.decorate('request', 'ws', ws);
  cpServer.decorate('request', 'models', models);
  server.start(function (err) {
    if (err) throw err;
    log.info('Server running on 8050, 3050');
  });
});
