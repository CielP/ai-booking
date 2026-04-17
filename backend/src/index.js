require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const roomsRouter = require('./routes/rooms');
const bookingsRouter = require('./routes/bookings');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const knowledgeRouter = require('./routes/knowledge');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOrigin = process.env.CORS_ORIGIN || true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/knowledge', knowledgeRouter);
app.use('/api/chat', chatRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
});

// Sync admin password from ADMIN_PASSWORD env var on startup
async function syncAdminPassword() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return;
  try {
    const { rows } = await pool.query(
      "SELECT id, password_hash FROM users WHERE email = 'admin@hotel.com'"
    );
    if (rows.length === 0) return;
    const match = await bcrypt.compare(adminPassword, rows[0].password_hash);
    if (!match) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, rows[0].id]);
      console.log('Admin password synced from ADMIN_PASSWORD env var');
    }
  } catch (err) {
    console.error('Failed to sync admin password:', err.message);
  }
}

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  syncAdminPassword();
});
