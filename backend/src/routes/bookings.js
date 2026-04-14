const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireAuth } = require('../middleware/auth');

// GET /api/bookings — 需要登入；admin 看全部，guest 只看自己的
router.get('/', authenticate, requireAuth, async (req, res, next) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(
        `SELECT id, room_number, guest_name, guest_email, check_in, check_out, notes, status, created_at, user_id
         FROM bookings
         ORDER BY check_in ASC`
      );
    } else {
      result = await pool.query(
        `SELECT id, room_number, guest_name, guest_email, check_in, check_out, notes, status, created_at, user_id
         FROM bookings
         WHERE user_id = $1
         ORDER BY check_in ASC`,
        [req.user.id]
      );
    }
    res.json({ bookings: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings — 需要登入；姓名/email 由 JWT 帶入
router.post('/', authenticate, requireAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { room_number, check_in, check_out, notes } = req.body;
    const guest_name = req.user.name;
    const guest_email = req.user.email;
    const user_id = req.user.id;

    if (!room_number || !check_in || !check_out) {
      return res.status(400).json({ error: '房間號碼、入住日期、退房日期為必填欄位' });
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

    const roomCheck = await client.query(
      'SELECT room_number FROM rooms WHERE room_number = $1',
      [room_number]
    );
    if (roomCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `房間 ${room_number} 不存在` });
    }

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

    const result = await client.query(
      `INSERT INTO bookings (room_number, guest_name, guest_email, check_in, check_out, notes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, room_number, guest_name, guest_email, check_in, check_out, notes, status, created_at`,
      [room_number, guest_name, guest_email, check_in, check_out, notes || null, user_id]
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

// DELETE /api/bookings/:id — 需要登入；guest 只能取消自己的，admin 可取消任何
router.delete('/:id', authenticate, requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const found = await pool.query(
      'SELECT id, user_id, status FROM bookings WHERE id = $1',
      [id]
    );

    if (found.rows.length === 0) {
      return res.status(404).json({ error: '訂單不存在' });
    }

    const booking = found.rows[0];

    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: '無權取消此訂單' });
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
