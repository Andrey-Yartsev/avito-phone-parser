const Hapi = require('hapi');
const server = new Hapi.Server();
server.connection({
  port: 8050
});
server.route(require('./lib/routes'));

require('./lib/db')(function(models) {
  console.log('Mongo connected');
  server.decorate('request', 'models', models);
  server.start(function (err) {
    if (err) throw err;
    console.log('Server running on 8050');
  });
});

