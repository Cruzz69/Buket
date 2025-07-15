const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { isVendor } = require('../middleware/authMiddleware');
const path = require('path');
const fs = require('fs');




// fr u vendor ;)
router.get('/new', isVendor, (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, '../views/create_event.html'), 'utf8');
  res.send(html);
});

// newww
router.post('/new', isVendor, async (req, res) => {
  try {
    const {
      title, category, description,
      date, time, venue,
      source, destination,
      price, totalSeats
    } = req.body;

    const newEvent = new Event({
      title,
      category,
      description,
      date,
      time,
      venue,
      source: category === 'train' ? source : '',
      destination: category === 'train' ? destination : '',
      price: parseInt(price),
      totalSeats: parseInt(totalSeats),
      availableSeats: parseInt(totalSeats),
      vendor: req.session.userId,
      status: 'pending' // consent 
    });



    await newEvent.save();
    res.send(`<h2 style="font-family:DM Serif Display;color:#4a90e2;text-align:center;">✅ Event created  Yay! ...wait for approval</h2><p style="text-align:center;"><a href="/events/new">Create Another</a> | <a href="/events">Back to Events</a></p>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('⚠️ Failed to create event.');
  }
});

module.exports = router;
