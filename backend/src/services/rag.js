const pool = require('../db');
const { generateEmbedding } = require('./embedding');

async function searchChunks(query, topK = 3) {
  const embedding = await generateEmbedding(query);
  const vectorStr = `[${embedding.join(',')}]`;

  const result = await pool.query(
    `SELECT id, title, content,
            1 - (embedding <=> $1::vector) AS similarity
     FROM knowledge_chunks
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vectorStr, topK]
  );

  return result.rows;
}

module.exports = { searchChunks };
