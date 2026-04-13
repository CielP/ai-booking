const express = require('express');
const router = express.Router();
const pool = require('../db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/bookings?email=xxx
router.get('/', async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: '請提供 email 參數' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Email 格式無效' });
    }

    const result = await pool.query(
      `SELECT id, room_number, guest_name, guest_email, check_in, check_out, notes, status, created_at
       FROM bookings
       WHERE guest_email = $1
       ORDER BY check_in ASC`,
      [email]
    );

    res.json({ bookings: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings
router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { guest_name, guest_email, room_number, check_in, check_out, notes } = req.body;

    // Validate required fields
    if (!guest_name || !guest_email || !room_number || !check_in || !check_out) {
      return res.status(400).json({ error: '姓名、Email、房間號碼、入住日期、退房日期為必填欄位' });
    }

    if (!EMAIL_REGEX.test(guest_email)) {
      return res.status(400).json({ error: 'Email 格式無效' });
    }

    const inDate = new Date(check_in);
    const outDate = new Date(check_out);

    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
      return res.status(400).json({ error: '日期格式無效，請使用 YYYY-MM-DD' });
    }

    if (outDate <= inDate) {
      return res.status(400).json({ error: '退房日期必須晚於入住日期' });
    }

    await client.query('BEGIN');

    // Check room exists
    const roomCheck = await client.query(
      'SELECT room_number FROM rooms WHERE room_number = $1',
      [room_number]
    );
    if (roomCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `房間 ${room_number} 不存在` });
    }

    // Check for booking conflicts (lock conflicting rows)
    const conflict = await client.query(
      `SELECT id FROM bookings
       WHERE room_number = $1
         AND status = 'active'
         AND check_in < $3
         AND check_out > $2
       FOR UPDATE`,
      [room_number, check_in, check_out]
    );

    if (conflict.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `房間 ${room_number} 在該日期區間已被預訂` });
    }

    // Create booking
    const result = await client.query(
      `INSERT INTO bookings (room_number, guest_name, guest_email, check_in, check_out, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, room_number, guest_name, guest_email, check_in, check_out, notes, status, created_at`,
      [room_number, guest_name, guest_email, check_in, check_out, notes || null]
    );

    await client.query('COMMIT');
    res.status(201).json({ booking: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// DELETE /api/bookings/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: '請提供 email 以驗證身份' });
    }

    // Find booking
    const found = await pool.query(
      'SELECT id, guest_email, status FROM bookings WHERE id = $1',
      [id]
    );

    if (found.rows.length === 0) {
      return res.status(404).json({ error: '訂單不存在' });
    }

    const booking = found.rows[0];

    if (booking.guest_email !== email) {
      return res.status(403).json({ error: '無權取消此訂單，Email 不符合' });
    }

    if (booking.status === 'cancelled') {
      return res.status(409).json({ error: '此訂單已取消' });
    }

    const result = await pool.query(
      `UPDATE bookings SET status = 'cancelled'
       WHERE id = $1
       RETURNING id, room_number, guest_name, guest_email, check_in, check_out, notes, status`,
      [id]
    );

    res.json({ booking: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
