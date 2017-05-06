const mongoose = require('mongoose');
//const objectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('One', mongoose.Schema({
  id: {
    type: String
  },
  phone: {
    type: String
  },
  accepted: {
    type: Boolean,
    default: false
  },
  lastCallDt: {
    type: Date,
    default: null
  }
}));
