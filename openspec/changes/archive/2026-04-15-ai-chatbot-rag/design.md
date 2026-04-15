## Context

目前旅館訂房網站僅提供靜態 UI 操作（查詢空房、訂房、取消）。旅客有住房規則相關疑問時，必須自行查閱文件或致電人工客服。住房規則文件（`rules.md`）包含 12 個主題區塊（取消政策、停車場、早餐方案等），適合以 RAG（Retrieval-Augmented Generation）方式供 AI 客服檢索引用。

系統目前的技術構成：React + Express + PostgreSQL + Docker Compose。已有完整的 JWT httpOnly Cookie 認證與 RBAC（admin/guest）機制。

## Goals / Non-Goals

**Goals:**
- 在現有 PostgreSQL 啟用 pgvector，建立知識庫向量儲存機制
- 提供完整的知識庫 CRUD 管理介面（admin 專屬）
- 實作 RAG 流程：embedding → 向量相似度搜尋 → 組合 prompt → Claude 生成回覆
- 支援 Claude tool use（查詢空房），讓 AI 可以即時回答空房查詢
- 以 SSE 串流方式回傳 Claude 回覆，提升使用者體驗
- 前端提供浮動聊天視窗，僅 admin 可見
- system prompt 支援動態變數注入（用戶名、當前頁面、已選日期）

**Non-Goals:**
- 聊天記錄持久化到資料庫（本版僅保存在前端 session state）
- 開放給 guest 或匿名訪客使用聊天功能
- system prompt 的管理後台編輯介面
- 多輪遞迴 tool call chain（本版僅處理單次 tool call loop）
- embedding 模型的管理後台切換

## Decisions

### 1. Docker image 改用 pgvector/pgvector:pg16

**選擇**: 將 `docker-compose.yml` 中的 db image 從 `postgres:16-alpine` 改為 `pgvector/pgvector:pg16`

**理由**: pgvector 官方 Docker image 已內含 `vector` extension，無需在 alpine 上自行編譯安裝。與原 postgres:16 完全相容。

**替代方案**: 使用 `postgres:16` + 在 Dockerfile 中編譯 pgvector — 過程複雜且不穩定，不值得維護。

### 2. Embedding 模型使用 OpenAI text-embedding-3-small

**選擇**: 使用 OpenAI text-embedding-3-small（1536 維度）

**理由**: 成本低 ($0.02/1M tokens)、品質足夠用於旅館規則的語義搜尋、社群廣泛使用。Anthropic 目前不提供 embedding API。

**替代方案**:
- Voyage AI voyage-3-lite：需額外 API key，社群資源較少
- 本地 Ollama nomic-embed-text：需多一個 Docker 容器，增加部署複雜度

### 3. 向量索引使用 HNSW

**選擇**: 在 `knowledge_chunks.embedding` 欄位使用 HNSW index（cosine distance）

**理由**: 知識庫 chunk 數量小（<100），HNSW 比 IVFFlat 更適合小資料集，不需 training step。查詢速度快且 recall 高。

### 4. Chat API 使用 SSE（Server-Sent Events）

**選擇**: `POST /api/chat` 返回 `text/event-stream`，逐步串流 Claude 回覆

**理由**: SSE 比 WebSocket 簡單，單向串流足夠。前端使用 `fetch` + `ReadableStream` 即可解析，不需引入額外函式庫（如 socket.io）。

**替代方案**: WebSocket — 支援雙向通訊但本需求不需要，增加實作複雜度。

### 5. Tool use 架構：單次 tool call loop

**選擇**: Claude 回覆中若包含 `tool_use` block，後端執行對應操作後將 `tool_result` 送回 Claude 繼續生成，僅處理一次 loop。

**理由**: 目前僅有一個 tool（`check_availability`），單次 loop 足夠。遞迴多輪 tool call 會增加複雜度與延遲。

**Tool 定義**:
```json
{
  "name": "check_availability",
  "description": "查詢特定日期範圍內的可用房間。回傳可用房間號碼清單與各房間描述。",
  "input_schema": {
    "type": "object",
    "properties": {
      "check_in": { "type": "string", "description": "入住日期，格式 YYYY-MM-DD" },
      "check_out": { "type": "string", "description": "退房日期，格式 YYYY-MM-DD" }
    },
    "required": ["check_in", "check_out"]
  }
}
```

### 6. System prompt 動態注入

**選擇**: 後端讀取 `backend/src/prompts/system.md` 模板，在每次聊天請求時替換 `{{user_name}}`、`{{current_page}}`、`{{prefill_date}}`，並在末尾附加 RAG 檢索到的知識庫 chunks。

**理由**: 讓 Claude 知道對話上下文（誰在問、在哪個頁面、已選了什麼日期），提升回答的準確度與相關性。

### 7. 知識庫 Markdown 匯入採用 H2 分段

**選擇**: `POST /api/admin/knowledge/import` 接收 markdown 文本，以 `## ` (H2 heading) 為分界點切分 chunks，H2 標題作為 chunk title，該段全部內容作為 chunk content。

**理由**: 與 `rules.md` 的現有結構完全一致（每個 H2 段落為獨立 chunk），不需用戶手動切分。

### 8. 前端聊天記錄僅存 session state

**選擇**: 聊天記錄保存在 React 元件的 state 中，關閉聊天視窗或重新整理頁面後消失。

**理由**: 本階段為 admin 測試用途，不需持久化。減少 DB schema 與 API 的複雜度。未來需要時可擴展為 DB 儲存。

## DB Schema 變更

```sql
-- 啟用 pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 知識庫 chunks 表
CREATE TABLE knowledge_chunks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      VARCHAR(200) NOT NULL,
  content    TEXT NOT NULL,
  embedding  vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HNSW 向量索引（cosine distance）
CREATE INDEX idx_knowledge_embedding ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);
```

## API 端點變更

| 方法 | 路徑 | 權限 | 說明 |
|------|------|------|------|
| POST | `/api/chat` | requireAdmin | SSE 聊天端點，接收 message/history/context |
| GET | `/api/admin/knowledge` | requireAdmin | 列出所有 chunks（不含 embedding） |
| POST | `/api/admin/knowledge` | requireAdmin | 新增 chunk（自動產生 embedding） |
| PATCH | `/api/admin/knowledge/:id` | requireAdmin | 更新 chunk（自動重新產生 embedding） |
| DELETE | `/api/admin/knowledge/:id` | requireAdmin | 刪除 chunk |
| POST | `/api/admin/knowledge/import` | requireAdmin | Markdown 匯入（按 H2 分段） |
| POST | `/api/admin/knowledge/reembed` | requireAdmin | 重新產生所有 embedding |

## Risks / Trade-offs

- **[外部 API 依賴]** → 依賴 OpenAI（embedding）與 Anthropic（Claude）兩個外部 API。若 API 不可用，聊天功能無法使用。知識庫 CRUD（不含 embedding 產生）仍可正常運作。Mitigation: embedding 失敗時 chunk 仍可儲存（embedding 欄位允許 null），後續用 reembed 補建。
- **[Volume 重建]** → 切換 Docker image 後，現有 `pg_data` volume 需 `docker compose down -v` 重建，現有資料（用戶、訂單）會丟失。Mitigation: 本專案為開發環境，init.sql 會重新 seed。正式環境需使用 migration 工具。
- **[API Key 洩漏風險]** → `ANTHROPIC_API_KEY` 和 `OPENAI_API_KEY` 儲存在 `.env` 中。Mitigation: `.env` 已在 `.gitignore` 中，且只透過後端環境變數傳遞，不暴露給前端。
- **[成本控制]** → Claude API 與 OpenAI embedding 的呼叫會產生費用。Mitigation: 本階段僅開放 admin 使用，呼叫頻率極低。
