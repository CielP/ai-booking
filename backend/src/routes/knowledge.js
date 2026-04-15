const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { generateEmbedding } = require('../services/embedding');

router.use(authenticate, requireAdmin);

// GET /api/admin/knowledge — 列出所有 chunks（不含 embedding）
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, title, content, created_at, updated_at
       FROM knowledge_chunks
       ORDER BY created_at ASC`
    );
    res.json({ chunks: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/knowledge — 新增 chunk
router.post('/', async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: '請提供 title 與 content' });
    }

    let embedding = null;
    try {
      embedding = await generateEmbedding(`${title}\n${content}`);
    } catch (e) {
      console.error('Embedding 產生失敗:', e.message);
    }

    const vectorStr = embedding ? `[${embedding.join(',')}]` : null;
    const result = await pool.query(
      `INSERT INTO knowledge_chunks (title, content, embedding)
       VALUES ($1, $2, $3::vector)
       RETURNING id, title, content, created_at, updated_at`,
      [title, content, vectorStr]
    );

    res.status(201).json({ chunk: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/knowledge/:id — 更新 chunk
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (title === undefined && content === undefined) {
      return res.status(400).json({ error: '請提供 title 或 content' });
    }

    // 取得現有資料
    const existing = await pool.query(
      'SELECT title, content FROM knowledge_chunks WHERE id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: '知識庫項目不存在' });
    }

    const newTitle = title !== undefined ? title : existing.rows[0].title;
    const newContent = content !== undefined ? content : existing.rows[0].content;

    let embedding = null;
    try {
      embedding = await generateEmbedding(`${newTitle}\n${newContent}`);
    } catch (e) {
      console.error('Embedding 產生失敗:', e.message);
    }

    const vectorStr = embedding ? `[${embedding.join(',')}]` : null;
    const result = await pool.query(
      `UPDATE knowledge_chunks
       SET title = $1, content = $2, embedding = COALESCE($3::vector, embedding), updated_at = NOW()
       WHERE id = $4
       RETURNING id, title, content, created_at, updated_at`,
      [newTitle, newContent, vectorStr, id]
    );

    res.json({ chunk: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/knowledge/:id — 刪除 chunk
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM knowledge_chunks WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '知識庫項目不存在' });
    }
    res.json({ message: '已刪除' });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/knowledge/import — Markdown H2 分段匯入
router.post('/import', async (req, res, next) => {
  try {
    const { markdown } = req.body;
    if (!markdown) {
      return res.status(400).json({ error: '請提供 markdown 內容' });
    }

    // 以 ## 分段
    const sections = markdown.split(/(?=^## )/m).filter(s => s.trim());
    const chunks = [];
    for (const section of sections) {
      const match = section.match(/^## (.+)/);
      if (!match) continue;
      const title = match[1].trim();
      const content = section.trim();
      chunks.push({ title, content });
    }

    if (chunks.length === 0) {
      return res.status(400).json({ error: '未偵測到 H2 標題，無法分段匯入' });
    }

    let created = 0;
    let updated = 0;

    for (const chunk of chunks) {
      let embedding = null;
      try {
        embedding = await generateEmbedding(`${chunk.title}\n${chunk.content}`);
      } catch (e) {
        console.error('Embedding 產生失敗:', e.message);
      }
      const vectorStr = embedding ? `[${embedding.join(',')}]` : null;

      // UPSERT：同 title 則更新
      const result = await pool.query(
        `INSERT INTO knowledge_chunks (title, content, embedding)
         VALUES ($1, $2, $3::vector)
         ON CONFLICT (title) DO UPDATE
         SET content = EXCLUDED.content,
             embedding = COALESCE(EXCLUDED.embedding, knowledge_chunks.embedding),
             updated_at = NOW()
         RETURNING xmax`,
        [chunk.title, chunk.content, vectorStr]
      );
      // xmax = 0 means INSERT, > 0 means UPDATE
      if (result.rows[0].xmax === '0') {
        created++;
      } else {
        updated++;
      }
    }

    res.json({ message: `匯入完成：新增 ${created} 筆，更新 ${updated} 筆`, created, updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/knowledge/reembed — 重新產生所有 embedding
router.post('/reembed', async (req, res, next) => {
  try {
    const all = await pool.query('SELECT id, title, content FROM knowledge_chunks');
    let count = 0;

    for (const row of all.rows) {
      try {
        const embedding = await generateEmbedding(`${row.title}\n${row.content}`);
        const vectorStr = `[${embedding.join(',')}]`;
        await pool.query(
          'UPDATE knowledge_chunks SET embedding = $1::vector, updated_at = NOW() WHERE id = $2',
          [vectorStr, row.id]
        );
        count++;
      } catch (e) {
        console.error(`Embedding 失敗 (${row.id}):`, e.message);
      }
    }

    res.json({ updated: count });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
