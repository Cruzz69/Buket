const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboardcat',
  resave: false,
  saveUninitialized: false
}));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(' MongoDB error:', err));

// Routes
app.use('/', require('./routes/auth'));
app.use('/events', require('./routes/event'));
app.use('/bookings', require('./routes/booking'));
app.use('/admin', require('./routes/admin'));

// Fallback(always LAST)
app.get('*', (req, res) => {
  res.status(404).send('Page not found');
});

module.exports = app;
