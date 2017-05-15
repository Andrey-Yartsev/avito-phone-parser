const mongoose = require('mongoose');

module.exports = mongoose.model('Source', mongoose.Schema({
  url: {
    type: String
  }
}));
