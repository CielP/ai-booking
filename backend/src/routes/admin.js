const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, role, is_active, created_at
       FROM users
       ORDER BY created_at ASC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, is_active } = req.body;

    if (id === req.user.id && is_active === false) {
      return res.status(400).json({ error: '無法停用自己的帳號' });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (role !== undefined) {
      if (!['admin', 'guest'].includes(role)) {
        return res.status(400).json({ error: '角色必須為 admin 或 guest' });
      }
      fields.push(`role = $${idx++}`);
      values.push(role);
    }
    if (is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(is_active);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: '請提供要更新的欄位（role 或 is_active）' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING id, email, name, role, is_active, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id — 軟刪除（設 is_active = false）
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: '無法停用自己的帳號' });
    }

    const result = await pool.query(
      `UPDATE users SET is_active = false
       WHERE id = $1
       RETURNING id, email, name, role, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/rooms
router.get('/rooms', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT room_number, description FROM rooms ORDER BY room_number ASC'
    );
    res.json({ rooms: result.rows });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/rooms/:room_number
router.patch('/rooms/:room_number', async (req, res, next) => {
  try {
    const { room_number } = req.params;
    const { description } = req.body;

    if (description === undefined) {
      return res.status(400).json({ error: '請提供 description 欄位' });
    }

    const result = await pool.query(
      `UPDATE rooms SET description = $1
       WHERE room_number = $2
       RETURNING room_number, description`,
      [description, parseInt(room_number)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '房間不存在' });
    }

    res.json({ room: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
