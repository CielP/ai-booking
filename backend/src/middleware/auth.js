const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '請先登入' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '請先登入' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理者權限' });
  }
  next();
}

module.exports = { authenticate, requireAuth, requireAdmin };
