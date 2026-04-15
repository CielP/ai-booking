const express = require('express');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { searchChunks } = require('../services/rag');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_TEMPLATE = fs.readFileSync(
  path.join(__dirname, '../prompts/system.md'),
  'utf-8'
);

const TOOL_DEFINITIONS = [
  {
    name: 'check_availability',
    description: '查詢特定日期範圍內的可用房間。回傳可用房間號碼清單與各房間描述。',
    input_schema: {
      type: 'object',
      properties: {
        check_in: { type: 'string', description: '入住日期，格式 YYYY-MM-DD' },
        check_out: { type: 'string', description: '退房日期，格式 YYYY-MM-DD' },
      },
      required: ['check_in', 'check_out'],
    },
  },
];

async function executeCheckAvailability(checkIn, checkOut) {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);

  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
    return { error: '日期格式無效，請使用 YYYY-MM-DD' };
  }
  if (outDate <= inDate) {
    return { error: '退房日期必須晚於入住日期' };
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
    [checkIn, checkOut]
  );

  return {
    check_in: checkIn,
    check_out: checkOut,
    available_count: result.rows.length,
    rooms: result.rows,
  };
}

function buildSystemPrompt(context, knowledgeChunks) {
  let prompt = SYSTEM_TEMPLATE;
  prompt = prompt.replace('{{user_name}}', context.userName || '訪客');
  prompt = prompt.replace('{{current_page}}', context.currentPage || '未知');
  prompt = prompt.replace('{{prefill_date}}', context.prefillDate || '未選擇');

  if (knowledgeChunks && knowledgeChunks.length > 0) {
    const knowledgeText = knowledgeChunks
      .map((c) => `### ${c.title}\n${c.content}`)
      .join('\n\n---\n\n');
    prompt = prompt.replace('{{knowledge_context}}', knowledgeText);
  } else {
    prompt = prompt.replace('{{knowledge_context}}', '（目前知識庫無相關資料）');
  }

  return prompt;
}

// POST /api/chat — SSE streaming chat
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { message, history, context } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: '請輸入訊息' });
    }

    // RAG: search relevant chunks
    let knowledgeChunks = [];
    try {
      knowledgeChunks = await searchChunks(message, 3);
    } catch (e) {
      console.error('RAG 搜尋失敗:', e.message);
    }

    const systemPrompt = buildSystemPrompt(context || {}, knowledgeChunks);

    // Build messages array from history
    const messages = [];
    if (Array.isArray(history)) {
      for (const h of history) {
        if (h.role === 'user' || h.role === 'assistant') {
          messages.push({ role: h.role, content: h.content });
        }
      }
    }
    messages.push({ role: 'user', content: message });

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // First call — non-streaming to detect tool use vs text
    const firstResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools: TOOL_DEFINITIONS,
    });

    const toolUseBlock = firstResponse.content.find((b) => b.type === 'tool_use');

    if (toolUseBlock && toolUseBlock.name === 'check_availability') {
      // Execute tool
      const toolResult = await executeCheckAvailability(
        toolUseBlock.input.check_in,
        toolUseBlock.input.check_out
      );

      res.write(`data: ${JSON.stringify({ type: 'tool_call', tool: 'check_availability', input: toolUseBlock.input })}\n\n`);

      // Second call with tool result — streaming
      const streamMessages = [
        ...messages,
        { role: 'assistant', content: firstResponse.content },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: JSON.stringify(toolResult),
            },
          ],
        },
      ];

      await streamResponse(res, systemPrompt, streamMessages);
    } else {
      // No tool use — send text blocks from the first response as a stream
      for (const block of firstResponse.content) {
        if (block.type === 'text') {
          res.write(`data: ${JSON.stringify({ type: 'text', content: block.text })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    }

    req.on('close', () => {
      res.end();
    });
  } catch (err) {
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', content: '伺服器發生錯誤' })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
});

function streamResponse(res, systemPrompt, messages) {
  return new Promise((resolve, reject) => {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools: TOOL_DEFINITIONS,
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
    });

    stream.on('error', (err) => {
      console.error('Claude stream error:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', content: 'AI 回覆時發生錯誤' })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
      resolve();
    });

    stream.on('end', () => {
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
      resolve();
    });
  });
}

module.exports = router;
