const wsClient = require("socket.io-client");
module.exports = wsClient.connect("http://localhost:3050/");
