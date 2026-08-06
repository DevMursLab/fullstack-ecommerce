const jwt = require('jsonwebtoken');

// Attaches req.user if a valid token is present, but never blocks the request.
// Used for endpoints that allow both guest and logged-in access (booking, checkout).
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id, role: decoded.role };
    }
  } catch (err) {
    // ignore invalid token — proceed as guest
  }
  next();
}

module.exports = optionalAuth;
