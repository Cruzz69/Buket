// --- models/Booking.js ---
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  quantity: Number,
  totalPrice: Number,
  dateBooked: { type: Date, default: Date.now },
  source: String,
  destination: String
});

module.exports = mongoose.model('Booking', bookingSchema);