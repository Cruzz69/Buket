const User = require('../models/User');
const Booking = require('../models/Booking');
const Event = require('../models/Event');

router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).lean();
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
    html = html.replace('{{username}}', user.username)
               .replace('{{email}}', user.email)
               .replace('{{role}}', user.role);

    const bookingCards = enhancedBookings.map(b => {
      return `
        <div class="booking-card">
          <p><strong>Event:</strong> ${b.event.title}</p>
          <p><strong>Date:</strong> ${b.event.date} ${b.event.time}</p>
          <p><strong>Venue:</strong> ${b.event.venue}</p>
          <p><strong>Quantity:</strong> ${b.quantity}</p>
          <p><strong>Total Paid:</strong> ₹${b.totalPrice}</p>
          ${b.cancellable ? `<form method="POST" action="/bookings/${b._id}/cancel">
            <button type="submit" class="cancel-btn">Cancel Booking</button>
          </form>` : ''}
        </div>
      `;
    }).join('');

    html = html.replace(/{{#each bookings}}([\s\S]*?){{\/each}}/, bookingCards);
    res.send(html);

  } catch (err) {
    res.status(500).send('Error loading profile.');
  }
});


// Edit Profile Routes

router.get('/profile/edit', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).lean();
    let html = fs.readFileSync(path.join(__dirname, '../views/edit-profile.html'), 'utf8');
    html = html.replace('{{username}}', user.username)
               .replace('{{email}}', user.email);
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Unable to load edit profile page.');
  }
});

router.post('/profile/edit', isAuthenticated, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.session.userId);
    user.username = username;
    user.email = email;
    await user.save();
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to update profile.');
  }
});

router.get('/profile/password', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/change-password.html'));
});

router.post('/profile/password', isAuthenticated, async (req, res) => {
  const { current, newPass, confirm } = req.body;
  if (newPass !== confirm) return res.send('New passwords do not match.');

  try {
    const user = await User.findById(req.session.userId);
    const isMatch = await bcrypt.compare(current, user.password);
    if (!isMatch) return res.send('Current password is incorrect.');

    const hashed = await bcrypt.hash(newPass, 10);
    user.password = hashed;
    await user.save();

    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to change password.');
  }
});
