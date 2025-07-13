const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const User = require('../models/User');

// GET: Login Page
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

// GET: Register Page
router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/register.html'));
});

// POST: Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).send('❌ User already exists.');

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashed, role });
    await newUser.save();

    // ✅ Just confirm registration success
    return res.status(200).send('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('⚠️ Registration failed.');
  }
});

// POST: Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).send('❌ User not found');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send('❌ Incorrect password');

    req.session.userId = user._id;
    req.session.role = user.role;

    // ✅ Tell client where to redirect
    if (user.role === 'admin') return res.status(200).send('/admin/dashboard');
    if (user.role === 'vendor') return res.status(200).send('/events/new');
    return res.status(200).send('/events');
  } catch (err) {
    console.error(err);
    return res.status(500).send('⚠️ Login failed.');
  }
});

// GET: Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('../views/login');
  });
});

module.exports = router;
