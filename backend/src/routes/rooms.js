const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/rooms/available?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD
router.get('/available', async (req, res, next) => {
  try {
    const { check_in, check_out } = req.query;

    if (!check_in || !check_out) {
      return res.status(400).json({ error: '請提供 check_in 與 check_out 參數' });
    }

    const inDate = new Date(check_in);
    const outDate = new Date(check_out);

    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
      return res.status(400).json({ error: '日期格式無效，請使用 YYYY-MM-DD' });
    }

    if (outDate <= inDate) {
      return res.status(400).json({ error: '退房日期必須晚於入住日期' });
    }

    const result = await pool.query(
      `SELECT r.room_number, r.description
       FROM rooms r
       WHERE r.room_number NOT IN (
         SELECT b.room_number FROM bookings b
         WHERE b.status = 'active'
           AND b.check_in < $2
           AND b.check_out > $1
       )
       ORDER BY r.room_number`,
      [check_in, check_out]
    );

    res.json({ rooms: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
