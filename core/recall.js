const log = require('./lib/log');
if (!process.argv[2]) {
  log.error('Syntax: node recall.js {sourceHash}');
  return;
}
const sourceHash = process.argv[2];

const wsClient = require("socket.io-client");
const wsConnection = wsClient.connect("http://localhost:3050/");
const recall = require("./lib/call/recall");
const scheduleMatch = require('./lib/call/schedule/match');

require('./lib/call/recallProcess')(sourceHash).init();
require('./lib/db')(function (models) {
  const tick = () => {
    if (!scheduleMatch(new Date())) return;
    recall(wsConnection, models, sourceHash);
  };
  tick();
  setInterval(tick, 5000);
});
