const mongoose = require('mongoose');

module.exports = mongoose.model('Source', mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  updating: {
    type: Boolean,
    default: false
  },
  lastLinksPage: {
    type: Number,
    default: 0
  }
}));
