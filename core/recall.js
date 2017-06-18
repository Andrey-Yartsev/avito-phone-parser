const wsClient = require("socket.io-client");
const wsConnection = wsClient.connect("http://localhost:3050/");
const recall = require("./lib/call/recall");

require('./lib/db')(function (models) {
  const tick = () => {
    recall(wsConnection, models);
  };
  tick();
  setInterval(tick, 5000);
});
