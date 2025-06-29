const mongoose = require('mongoose');

const AlcoholReadingSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  deviceId: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('AlcoholReading', AlcoholReadingSchema); 