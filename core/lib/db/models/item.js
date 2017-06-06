const mongoose = require('mongoose');
//const objectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('Item', mongoose.Schema({
  sourceHash: {
    type: String
  },
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
  phone: {
    type: String
  },
  accepted: {
    type: Number,
    default: null
  },
  lastCallDt: {
    type: Date,
    default: null
  },
  resultDt: {
    type: Date,
    default: null
  },
  callStatus: {
    type: String
  },
  retries: {
    type: Number,
    default: 0
  },
  test: {
    type: Boolean,
    default: false
  }
}));
