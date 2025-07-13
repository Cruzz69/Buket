const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

// Middleware to restrict access to admins
function isAdmin(req, res, next) {
  if (req.session.role !== 'admin') return res.status(403).send('Access denied');
  next();
}

// --- Dashboard GET ---
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const users = await User.find().lean();
    const events = await Event.find().populate('vendor').lean();
    const bookings = await Booking.find().populate('event').lean();

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const userRows = users.map(u => `
      <tr><td>${u.username}</td><td>${u.email}</td><td>${u.role}</td></tr>
    `).join('');

    const eventRows = events.map(ev => `
      <tr>
        <td>${ev.title}</td>
        <td>${ev.vendor?.username || 'Unknown'}</td>
        <td>${ev.category}</td>
        <td>${ev.status}</td>
        <td>
          <form method="POST" action="/admin/events/${ev._id}/approve" style="display:inline-block">
            <button class="approve-btn">Approve</button>
          </form>
          <form method="POST" action="/admin/events/${ev._id}/reject" style="display:inline-block">
            <button class="reject-btn">Reject</button>
          </form>
          <form method="POST" action="/admin/events/${ev._id}/delete" style="display:inline-block">
            <button class="delete-btn">Delete</button>
          </form>
        </td>
      </tr>
    `).join('');

    let html = fs.readFileSync(path.join(__dirname, '../views/admin-dashboard.html'), 'utf8');
    html = html.replace('{{totalUsers}}', users.length)
               .replace('{{totalVendors}}', users.filter(u => u.role === 'vendor').length)
               .replace('{{totalEvents}}', events.length)
               .replace('{{totalBookings}}', bookings.length)
               .replace('{{totalRevenue}}', totalRevenue);
    html = html.replace(/{{#each users}}([\s\S]*?){{\/each}}/, userRows);
    html = html.replace(/{{#each events}}([\s\S]*?){{\/each}}/, eventRows);

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load admin dashboard');
  }
});

// --- POST: Approve Event ---
router.post('/events/:id/approve', isAdmin, async (req, res) => {
  try {
    await Event.findByIdAndUpdate(req.params.id, { status: 'approved' });
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to approve event.');
  }
});

// --- POST: Reject Event ---
router.post('/events/:id/reject', isAdmin, async (req, res) => {
  try {
    await Event.findByIdAndUpdate(req.params.id, { status: 'rejected' });
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to reject event.');
  }
});

// --- POST: Delete Event ---
router.post('/events/:id/delete', isAdmin, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete event.');
  }
});

module.exports = router;
