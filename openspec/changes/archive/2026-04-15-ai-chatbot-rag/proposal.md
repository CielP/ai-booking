## Why

旅館需要 AI 客服功能，讓旅客可以即時詢問住房規則（取消政策、入住時間、寵物規定等）並查詢特定日期的空房狀況。目前這些資訊散落在靜態文件中，旅客無法在網站內快速取得答案。第一階段僅開放管理員使用與測試，驗證 RAG 品質與回答準確度後再開放給一般旅客。

## What Changes

- 在現有 PostgreSQL 啟用 pgvector 擴充，新增 `knowledge_chunks` 表儲存知識庫文本與向量
- 後端新增 embedding 服務（OpenAI text-embedding-3-small）與 RAG 搜尋服務
- 後端新增知識庫 CRUD API（admin-only），支援新增、編輯、刪除 chunk 以及從 Markdown 批次匯入
- 後端新增聊天 API，整合 Claude LLM + RAG 檢索 + tool use（查詢空房），以 SSE 串流回覆
- 前端新增浮動聊天視窗元件，僅 admin 可見，支援 SSE 串流逐字顯示
- 前端管理後台新增「知識庫管理」分頁，提供知識庫 CRUD 操作介面
- system prompt 加入知識庫上下文注入與動態變數替換（用戶名、當前頁面、已選日期）

## Capabilities

### New Capabilities
- `ai-chatbot`: AI 客服聊天功能，包含 Claude LLM 整合、RAG 檢索、tool use（查空房）、SSE 串流、浮動聊天視窗 UI
- `knowledge-base`: 知識庫管理功能，包含 pgvector 向量儲存、embedding 產生、CRUD API、Markdown 匯入、管理後台 UI

### Modified Capabilities
- `admin-dashboard`: 新增「知識庫管理」sub-tab，用於管理 knowledge chunks

## Impact

- **Database**: Docker image 從 `postgres:16-alpine` 改為 `pgvector/pgvector:pg16`；`init.sql` 新增 `vector` extension 與 `knowledge_chunks` 表。需 `docker compose down -v` 重建 volume
- **Backend 依賴**: 新增 `@anthropic-ai/sdk`（Claude API）、`openai`（embedding API）
- **環境變數**: 新增 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY`
- **API 端點**: 新增 `POST /api/chat`（requireAdmin）、`GET/POST/PATCH/DELETE /api/admin/knowledge`（requireAdmin）、`POST /api/admin/knowledge/import`、`POST /api/admin/knowledge/reembed`
- **前端**: 新增 `ChatWidget` 元件（admin-only）、AdminDashboard 新增知識庫 sub-tab
- **檔案**: 新增 `backend/src/services/embedding.js`、`backend/src/services/rag.js`、`backend/src/routes/knowledge.js`、`backend/src/routes/chat.js`、`backend/src/prompts/system.md`、`frontend/src/components/ChatWidget.jsx`
