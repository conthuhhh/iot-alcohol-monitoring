const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  licensePlate: {
    type: String,
    required: true,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: ['motorcycle', 'car'],
    default: 'motorcycle'
  },
  alcoholValue: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  deviceId: {
    type: String,
    default: 'unknown_device'
  }
});

module.exports = mongoose.model('Ticket', ticketSchema); 