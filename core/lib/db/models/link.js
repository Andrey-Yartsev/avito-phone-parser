const mongoose = require('mongoose');
//const objectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('Link', mongoose.Schema({
  url: {
    type: String
  },
  parseDt: {
    type: Date,
    default: null
  },
  parsing: {
    type: Boolean,
    default: false
  }
}));
