require('dotenv').config();
const express = require('express');
const cors = require('cors');

const roomsRouter = require('./routes/rooms');
const bookingsRouter = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/rooms', roomsRouter);
app.use('/api/bookings', bookingsRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
