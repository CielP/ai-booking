require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const roomsRouter = require('./routes/rooms');
const bookingsRouter = require('./routes/bookings');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const knowledgeRouter = require('./routes/knowledge');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
