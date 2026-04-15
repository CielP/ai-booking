## 1. 資料庫與基礎設施

- [x] 1.1 修改 `docker-compose.yml`：db image 改為 `pgvector/pgvector:pg16`，api service 新增 `ANTHROPIC_API_KEY` 與 `OPENAI_API_KEY` 環境變數
- [x] 1.2 修改 `docker/init.sql`：加入 `CREATE EXTENSION IF NOT EXISTS vector;` 與 `knowledge_chunks` 表（id UUID PK, title, content, embedding vector(1536), created_at, updated_at）及 HNSW index
- [x] 1.3 更新 `.env.example`：新增 `ANTHROPIC_API_KEY` 與 `OPENAI_API_KEY` 欄位

## 2. Backend — Embedding 與 RAG 服務

- [x] 2.1 修改 `backend/package.json`：新增 `@anthropic-ai/sdk` 與 `openai` 依賴
- [x] 2.2 新增 `backend/src/services/embedding.js`：封裝 `generateEmbedding(text)` 函式，呼叫 OpenAI text-embedding-3-small 回傳 1536 維浮點陣列
- [x] 2.3 新增 `backend/src/services/rag.js`：封裝 `searchChunks(query, topK=3)` 函式，對 query 產生 embedding 後用 pgvector cosine similarity 搜尋 knowledge_chunks 表

## 3. Backend — 知識庫 CRUD API

- [x] 3.1 新增 `backend/src/routes/knowledge.js`：實作 GET /api/admin/knowledge（列出所有 chunks，不含 embedding）
- [x] 3.2 實作 POST /api/admin/knowledge（新增 chunk，自動產生 embedding）
- [x] 3.3 實作 PATCH /api/admin/knowledge/:id（更新 chunk，自動重新產生 embedding）
- [x] 3.4 實作 DELETE /api/admin/knowledge/:id（刪除 chunk）
- [x] 3.5 實作 POST /api/admin/knowledge/import（Markdown H2 分段匯入，同 title 覆蓋更新）
- [x] 3.6 實作 POST /api/admin/knowledge/reembed（重新產生所有 chunks 的 embedding）
- [x] 3.7 修改 `backend/src/index.js`：掛載 knowledge routes 到 `/api/admin/knowledge`

## 4. Backend — Chat SSE 端點

- [x] 4.1 新增 `backend/src/prompts/system.md`：從 system-prompt.md 複製並加入知識庫參考資料 placeholder
- [x] 4.2 新增 `backend/src/routes/chat.js`：實作 POST /api/chat（requireAdmin），包含 RAG 檢索、system prompt 動態變數注入、Claude API streaming
- [x] 4.3 在 chat.js 中實作 check_availability tool use 處理：Claude 呼叫 tool → 執行 SQL 查詢 → 回傳 tool_result → 繼續 streaming
- [x] 4.4 修改 `backend/src/index.js`：掛載 chat route 到 `/api/chat`

## 5. Frontend — 浮動聊天視窗

- [x] 5.1 新增 `frontend/src/components/ChatWidget.jsx`：右下角浮動按鈕、展開/收合聊天視窗、訊息氣泡列表、輸入框
- [x] 5.2 在 ChatWidget 中實作 SSE 串流接收與逐字顯示邏輯
- [x] 5.3 在 ChatWidget 中實作 context 傳遞（user_name、current_page、prefill_date）
- [x] 5.4 修改 `frontend/src/App.jsx`：僅 admin 時 render ChatWidget，傳入 activeTab 與 bookPrefill 作為 context
- [x] 5.5 修改 `frontend/src/index.css`：新增聊天視窗、訊息氣泡、浮動按鈕的 CSS 樣式

## 6. Frontend — 知識庫管理介面

- [x] 6.1 修改 `frontend/src/pages/AdminDashboard.jsx`：新增「知識庫管理」sub-tab 與 KnowledgePanel 元件
- [x] 6.2 實作 KnowledgePanel：chunks 列表顯示（title、content 預覽、更新時間）
- [x] 6.3 實作新增 chunk 表單（title input + content textarea）
- [x] 6.4 實作編輯 chunk 功能（inline 展開編輯）
- [x] 6.5 實作刪除 chunk 功能（確認對話框）
- [x] 6.6 實作「匯入 Markdown」功能（textarea modal + import API 呼叫）
- [x] 6.7 實作「重新產生 Embedding」按鈕（確認後呼叫 reembed API）

## 7. System Prompt 微調

- [x] 7.1 修改 `system-prompt.md`：在「工具使用規則」中明確描述 check_availability tool，加入知識庫參考資料 section placeholder
