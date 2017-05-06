const mongoose = require('mongoose');
//const objectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('One', mongoose.Schema({
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
  },
  id: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  accepted: {
    type: Boolean,
    default: null
  },
  lastCallDt: {
    type: Date,
    default: null
  },
  test: {
    type: Boolean,
    default: false
  }
}));
