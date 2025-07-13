// --- routes/event.js ---
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { isAuthenticated, isVendor } = require('../middleware/authMiddleware');
const path = require('path');

router.get('/', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/events.html'));
});

router.get('/new', isVendor, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/create_event.html'));
});

router.post('/new', isVendor, async (req, res) => {
  const { title, category, description, date, time, venue, source, destination, price, totalSeats } = req.body;
  try {
    const event = new Event({
      title,
      category,
      description,
      date,
      time,
      venue,
      source: category === 'train' ? source : '',
      destination: category === 'train' ? destination : '',
      price,
      totalSeats,
      availableSeats: totalSeats,
      vendor: req.session.userId
    });
    await event.save();
    res.redirect('/events');
  } catch (err) {
    res.status(500).send('Failed to create event');
  }
});

module.exports = router;