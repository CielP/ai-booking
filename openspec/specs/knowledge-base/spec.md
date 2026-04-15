# Knowledge Base

## Purpose

定義知識庫管理功能的行為規格，包含 pgvector 向量儲存、OpenAI embedding 產生、知識庫 CRUD API、Markdown 匯入、embedding 重建，以及管理後台知識庫 UI。

## Requirements

### Requirement: 知識庫 chunk 的 CRUD 操作
系統 SHALL 提供 admin-only API 端點，對 knowledge_chunks 表進行完整 CRUD 操作。每個 chunk 包含 title（標題）與 content（內容）。新增或更新 chunk 時，系統 SHALL 自動使用 OpenAI text-embedding-3-small 產生 embedding 並儲存。

#### Scenario: Admin 新增知識庫 chunk
- **WHEN** admin 發送 POST /api/admin/knowledge，body 為 `{ title, content }`
- **THEN** 系統建立 chunk，自動產生 embedding，回傳完整 chunk 資料（不含 embedding 欄位）

#### Scenario: Admin 更新知識庫 chunk
- **WHEN** admin 發送 PATCH /api/admin/knowledge/:id，body 含 title 或 content
- **THEN** 系統更新 chunk，自動重新產生 embedding，回傳更新後的 chunk 資料

#### Scenario: Admin 刪除知識庫 chunk
- **WHEN** admin 發送 DELETE /api/admin/knowledge/:id
- **THEN** 系統刪除該 chunk（含 embedding），回傳成功訊息

#### Scenario: Admin 列出所有 chunks
- **WHEN** admin 發送 GET /api/admin/knowledge
- **THEN** 系統回傳所有 chunks 的清單（id, title, content, created_at, updated_at），不含 embedding 欄位

#### Scenario: 新增 chunk 但 title 或 content 為空
- **WHEN** admin 發送 POST /api/admin/knowledge，但 title 或 content 未提供
- **THEN** 系統回傳 400 錯誤 `{ "error": "請提供 title 與 content" }`

#### Scenario: 更新不存在的 chunk
- **WHEN** admin 發送 PATCH /api/admin/knowledge/:id，但 id 不存在
- **THEN** 系統回傳 404 錯誤 `{ "error": "知識庫項目不存在" }`

#### Scenario: 非 admin 存取知識庫 API
- **WHEN** guest 或匿名用戶呼叫任何 /api/admin/knowledge 端點
- **THEN** 系統回傳 403 錯誤

### Requirement: Markdown 批次匯入知識庫
系統 SHALL 提供 `POST /api/admin/knowledge/import` 端點，接收 Markdown 文本，以 H2 標題（`## `）為分界點自動分段，每個 H2 段落建立一個 chunk。已存在相同 title 的 chunk SHALL 被覆蓋更新。

#### Scenario: 匯入含多個 H2 段落的 Markdown
- **WHEN** admin 發送 POST /api/admin/knowledge/import，body 為 `{ markdown: "## 取消政策\n內容1\n\n## 停車場資訊\n內容2" }`
- **THEN** 系統建立 2 個 chunks（title 分別為「取消政策」、「停車場資訊」），各自產生 embedding，回傳匯入結果摘要

#### Scenario: 匯入的 Markdown 無 H2 標題
- **WHEN** admin 發送 POST /api/admin/knowledge/import，但 markdown 內容不含任何 `## ` 標題
- **THEN** 系統回傳 400 錯誤 `{ "error": "未偵測到 H2 標題，無法分段匯入" }`

#### Scenario: 匯入覆蓋既有 chunk
- **WHEN** 知識庫已有 title 為「取消政策」的 chunk，admin 匯入含「## 取消政策」的 Markdown
- **THEN** 系統更新既有 chunk 的 content 與 embedding，而非建立重複項目

### Requirement: 重新產生所有 embedding
系統 SHALL 提供 `POST /api/admin/knowledge/reembed` 端點，重新對所有 knowledge_chunks 產生 embedding。用於 embedding 模型更換或 embedding 資料需要重建的情境。

#### Scenario: Admin 觸發全部重新 embedding
- **WHEN** admin 發送 POST /api/admin/knowledge/reembed
- **THEN** 系統對所有 chunks 重新產生 embedding，回傳處理結果 `{ "updated": N }`

#### Scenario: 知識庫無任何 chunk
- **WHEN** admin 在空的知識庫觸發 reembed
- **THEN** 系統回傳 `{ "updated": 0 }`

### Requirement: 管理後台知識庫管理介面
系統 SHALL 在管理後台新增「知識庫管理」分頁，提供視覺化介面管理知識庫 chunks。

#### Scenario: Admin 查看知識庫列表
- **WHEN** admin 開啟管理後台的「知識庫管理」分頁
- **THEN** 系統顯示所有 chunks 的列表（title、content 預覽、更新時間）

#### Scenario: Admin 在 UI 新增 chunk
- **WHEN** admin 在知識庫管理頁面填入 title 與 content 並送出
- **THEN** 系統呼叫 API 新增 chunk，列表即時更新

#### Scenario: Admin 在 UI 編輯 chunk
- **WHEN** admin 點擊某 chunk 的「編輯」按鈕，修改內容後儲存
- **THEN** 系統呼叫 API 更新該 chunk，列表即時更新

#### Scenario: Admin 在 UI 刪除 chunk
- **WHEN** admin 點擊某 chunk 的「刪除」按鈕並確認
- **THEN** 系統呼叫 API 刪除該 chunk，列表即時更新

#### Scenario: Admin 匯入 Markdown
- **WHEN** admin 點擊「匯入 Markdown」按鈕，在 textarea 貼上 markdown 文本並送出
- **THEN** 系統呼叫 import API，匯入完成後列表即時更新，顯示匯入結果摘要

#### Scenario: Admin 重新產生 Embedding
- **WHEN** admin 點擊「重新產生 Embedding」按鈕並確認
- **THEN** 系統呼叫 reembed API，完成後顯示處理結果
