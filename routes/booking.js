console.log('[DEBUG] booking.js loaded');
// --- routes/booking.js ---
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/authMiddleware');
const path = require('path');
const generatePDF = require('../utils/pdfGenerator');
const fs = require('fs');
const nodemailer = require('nodemailer');





// booking form autoput feauture
router.get('/:id/book', isAuthenticated, async (req, res) => {
  const event = await Event.findById(req.params.id).lean();
  const formHTML = fs.readFileSync(path.join(__dirname, '../views/booking_form.html'), 'utf8');
  const page = formHTML
    .replace(/{{title}}/g, event.title)
    .replace(/{{price}}/g, event.price)
    .replace(/{{category}}/g, event.category)
    .replace(/{{eventId}}/g, event._id)
    .replace(/{{source}}/g, event.source || '')
    .replace(/{{destination}}/g, event.destination || '')
    .replace(/{{#if isTrain}}([\s\S]*?){{\/if}}/g, event.category === 'train' ? '$1' : '');
  res.send(page);
});

// confirm booking nd generate ticket
router.post('/bookings/confirm', isAuthenticated, async (req, res) => {
  try {
    const { eventId, quantity, price, source, destination } = req.body;
    const event = await Event.findById(eventId);
    const user = await User.findById(req.session.userId);
    const total = quantity * price;

    if (event.availableSeats < quantity) {
      return res.status(400).send('Not enough seats available.');
    }

    const booking = new Booking({
      user: user._id,
      event: event._id,
      quantity,
      totalPrice: total,
      source,
      destination
    });

    event.availableSeats -= quantity;
    user.balance -= total;
    user.bookings.push(booking._id);

    await booking.save();
    await event.save();
    await user.save();

    const filePath = await generatePDF(user, event, booking);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }

    });

    await transporter.sendMail({
      from: 'Just Buket <creator.tech1234@gmail.com>',
      to: user.email,
      subject: '🎫 Your Ticket Confirmation',
      text: 'Thank you for booking! Find your ticket attached.',
      attachments: [{ filename: 'ticket.pdf', path: filePath }]
    });

    res.download(filePath, 'ticket.pdf', (err) => {
      if (err) {
        console.error('❌ Download failed:', err);
        res.status(500).send('Could not download ticket.');
      } else {
        console.log('✅ Ticket downloaded by user');
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('⚠️ Booking failed.');
  }
});


// canceling
router.post('/:id/cancel', isAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('event');
    const user = await User.findById(req.session.userId);

    const eventDate = new Date(`${booking.event.date} ${booking.event.time}`);
    if (eventDate <= new Date()) return res.send('Cannot cancel past or current event.');

    // Refund balance
    user.balance += booking.totalPrice;
    booking.event.availableSeats += booking.quantity;

    // Remove booking
    user.bookings = user.bookings.filter(bid => bid.toString() !== booking._id.toString());

    await user.save();
    await booking.event.save();
    await Booking.findByIdAndDelete(req.params.id);

    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not cancel booking.');
  }
});

module.exports = router;
