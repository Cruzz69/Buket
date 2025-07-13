function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.redirect('/login'); 
  }
}

function isAdmin(req, res, next) {
  if (req.session && req.session.role === 'admin') {
    next();
  } else {
    res.status(403).send('Admin access required!');
  }
}

function isVendor(req, res, next) {
  if (req.session && req.session.role === 'vendor') {
    next();
  } else {
    res.status(403).send('Vendor access required!');
  }
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isVendor
};
