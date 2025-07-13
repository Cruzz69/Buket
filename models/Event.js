// --- models/Event.js ---
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: String,
  category: {
    type: String,
    enum: ['movie', 'concert', 'train'],
    required: true
  },
  description: String,
  date: String,
  time: String,
  venue: String,
  source: String,
  destination: String,
  price: Number,
  totalSeats: Number,
  availableSeats: Number,
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Event', eventSchema);

