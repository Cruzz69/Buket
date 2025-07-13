const mongoose = require('mongoose');
// User Schema for  Buket System
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user'
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: String,
  balance: {
    type: Number,
    default: 1000
  },
  profilePic: String,
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }]
});

module.exports = mongoose.model('User', userSchema);


