const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setTokenCookie(res, user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: '姓名、Email、密碼為必填欄位' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Email 格式無效' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: '密碼至少需要 8 個字元' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: '此 Email 已被註冊' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)
       RETURNING id, email, name, role`,
      [email, password_hash, name]
    );

    const user = result.rows[0];
    setTokenCookie(res, user);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email 與密碼為必填欄位' });
    }

    const result = await pool.query(
      'SELECT id, email, name, role, is_active, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email 或密碼不正確' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: '此帳號已被停用' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email 或密碼不正確' });
    }

    setTokenCookie(res, user);
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', { httpOnly: true, maxAge: 0 });
  res.json({ message: '已登出' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '尚未登入' });
  }
  res.json({ user: { id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role } });
});

module.exports = router;
