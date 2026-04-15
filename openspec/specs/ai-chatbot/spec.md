# AI Chatbot

## Purpose

定義 AI 客服聊天功能的行為規格，包含聊天 API、RAG 檢索、Claude LLM 整合、tool use（查詢空房）、SSE 串流回覆，以及前端浮動聊天視窗 UI。

## Requirements

### Requirement: 管理員可透過浮動聊天視窗與 AI 客服對話
系統 SHALL 在前端提供浮動聊天視窗元件，僅 admin 角色可見。聊天視窗固定於頁面右下角，可展開/收合。用戶輸入訊息後，系統透過 RAG 檢索知識庫相關內容，送入 Claude LLM 產生回覆，並以 SSE 串流方式逐字顯示。

#### Scenario: Admin 開啟聊天視窗
- **WHEN** admin 登入後，於任何頁面點擊右下角聊天按鈕
- **THEN** 系統展開聊天視窗，顯示歡迎訊息，輸入框可輸入訊息

#### Scenario: 非 admin 不顯示聊天按鈕
- **WHEN** guest 或匿名訪客瀏覽網站
- **THEN** 頁面不顯示浮動聊天按鈕

#### Scenario: Admin 傳送訊息並收到串流回覆
- **WHEN** admin 在聊天視窗輸入訊息並送出
- **THEN** 系統顯示用戶訊息氣泡，隨後以串流方式逐字顯示 AI 回覆

#### Scenario: API 回覆失敗
- **WHEN** 聊天 API 發生錯誤（例如外部 API 不可用）
- **THEN** 系統在聊天視窗顯示繁體中文錯誤訊息，用戶可重新輸入

### Requirement: 聊天 API 以 SSE 串流回傳 Claude 回覆
系統 SHALL 提供 `POST /api/chat` 端點，僅限 admin 存取（requireAdmin）。接收用戶訊息、對話歷史及上下文資訊，回傳 `text/event-stream` 格式的 SSE 串流。

#### Scenario: Admin 呼叫聊天 API
- **WHEN** admin 發送 POST /api/chat，body 為 `{ message, history, context }`
- **THEN** 系統回傳 `Content-Type: text/event-stream`，逐步串流 `data: {"type":"text","content":"..."}` 事件，最後送出 `data: {"type":"done"}`

#### Scenario: 非 admin 呼叫聊天 API
- **WHEN** guest 或匿名用戶呼叫 POST /api/chat
- **THEN** 系統回傳 403 錯誤 `{ "error": "需要管理者權限" }`

#### Scenario: 訊息為空
- **WHEN** admin 發送 POST /api/chat，但 message 為空字串
- **THEN** 系統回傳 400 錯誤 `{ "error": "請輸入訊息" }`

### Requirement: 聊天整合 RAG 知識庫檢索
系統 SHALL 在處理每次聊天請求時，對用戶訊息產生 embedding，透過 pgvector 向量相似度搜尋取得最相關的知識庫 chunks（預設 top 3），注入到 Claude 的 system prompt 中作為參考資料。

#### Scenario: 用戶詢問旅館規則相關問題
- **WHEN** admin 詢問「取消訂單可以退款嗎」
- **THEN** 系統檢索到「取消政策」相關 chunks，Claude 基於知識庫內容回答退款比例與條件

#### Scenario: 知識庫為空
- **WHEN** knowledge_chunks 表中無任何資料時，admin 發送聊天訊息
- **THEN** Claude 仍能回覆，但會說明目前沒有相關旅館資訊可供參考，建議聯繫人工客服

### Requirement: Claude tool use 查詢空房
系統 SHALL 定義 `check_availability` tool，當 Claude 判斷用戶詢問的是特定日期空房時，自動呼叫該 tool。後端執行 SQL 查詢後將結果回傳給 Claude，Claude 據此產生自然語言回覆。

#### Scenario: 用戶詢問特定日期空房
- **WHEN** admin 在聊天中問「4/20 到 4/22 有空房嗎？」
- **THEN** Claude 呼叫 check_availability tool（check_in: 2026-04-20, check_out: 2026-04-22），後端查詢 DB，Claude 回覆可用房間清單

#### Scenario: Tool 查詢結果無空房
- **WHEN** Claude 呼叫 check_availability，查詢結果為零間可用房間
- **THEN** Claude 回覆告知該日期已無空房，並建議調整日期或聯繫客服

#### Scenario: Tool 查詢日期格式無效
- **WHEN** Claude 傳入無效日期格式給 check_availability
- **THEN** 後端回傳錯誤訊息給 Claude，Claude 向用戶說明需要提供正確的日期格式

### Requirement: System prompt 動態變數注入
系統 SHALL 在組合 Claude system prompt 時，將 `{{user_name}}`、`{{current_page}}`、`{{prefill_date}}` 替換為實際值，並在末尾附加 RAG 檢索到的知識庫參考資料。

#### Scenario: 動態變數正確替換
- **WHEN** admin 名為「系統管理員」在「查詢空房」頁面發送聊天訊息
- **THEN** system prompt 中 `{{user_name}}` 為「系統管理員」，`{{current_page}}` 為「查詢空房」

#### Scenario: 無已選日期
- **WHEN** 前端未傳入 prefill_date（值為空）
- **THEN** system prompt 中 `{{prefill_date}}` 替換為「未選擇」
