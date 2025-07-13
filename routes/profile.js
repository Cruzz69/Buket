const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { isAuthenticated } = require('../middleware/authMiddleware');

//save me from xss
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, tag => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[tag]
  ));
}
//profile Page
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).lean();
    if (!user) return res.redirect('/login');

    const bookings = await Booking.find({ user: user._id })
      .populate('event')
      .lean();

    const enhancedBookings = bookings.map(b => {
      const eventDate = new Date(`${b.event.date} ${b.event.time}`);
      return {
        ...b,
        cancellable: eventDate > new Date()
      };
    });

    let html = fs.readFileSync(path.join(__dirname, '../views/profile.html'), 'utf8');
    html = html.replace('{{username}}', escapeHTML(user.username))
               .replace('{{email}}', escapeHTML(user.email))
               .replace('{{role}}', escapeHTML(user.role));

    const bookingCards = enhancedBookings.map(b => {
      return `
        <div class="booking-card">
          <p><strong>Event:</strong> ${escapeHTML(b.event.title)}</p>
          <p><strong>Date:</strong> ${escapeHTML(b.event.date)} ${escapeHTML(b.event.time)}</p>
          <p><strong>Venue:</strong> ${escapeHTML(b.event.venue)}</p>
          <p><strong>Quantity:</strong> ${b.quantity}</p>
          <p><strong>Total Paid:</strong> ₹${b.totalPrice}</p>
          ${b.cancellable ? `
          <form method="POST" action="/bookings/${b._id}/cancel">
            <button type="submit" class="cancel-btn">Cancel Booking</button>
          </form>` : ''}
        </div>
      `;
    }).join('');

    html = html.replace(/{{#each bookings}}([\s\S]*?){{\/each}}/, bookingCards);
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading profile.');
  }
});

// edit Profile Page
router.get('/profile/edit', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).lean();
    if (!user) return res.redirect('/login');

    let html = fs.readFileSync(path.join(__dirname, '../views/edit-profile.html'), 'utf8');
    html = html.replace('{{username}}', escapeHTML(user.username))
               .replace('{{email}}', escapeHTML(user.email));
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Unable to load edit profile page.');
  }
});

// Save Profile Changes
router.post('/profile/edit', isAuthenticated, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.session.userId);
    user.username = username.trim();
    user.email = email.trim();
    await user.save();
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to update profile.');
  }
});

// pss change
router.get('/profile/password', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/reset-password.html'));
});

//pass logic (most common one)
router.post('/profile/password', isAuthenticated, async (req, res) => {
  const { current, newPass, confirm } = req.body;
  if (newPass !== confirm) return res.status(400).send('New passwords do not match.');

  try {
    const user = await User.findById(req.session.userId);
    const isMatch = await bcrypt.compare(current, user.password);
    if (!isMatch) return res.status(400).send('Current password is incorrect.');

    const hashed = await bcrypt.hash(newPass, 10);
    user.password = hashed;
    await user.save();

    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to change password.');
  }
});

module.exports = router;
