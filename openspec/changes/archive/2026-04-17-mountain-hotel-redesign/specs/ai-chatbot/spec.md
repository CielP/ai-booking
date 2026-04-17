## MODIFIED Requirements

### Requirement: 管理員可透過浮動聊天視窗與 AI 客服對話
系統 SHALL 在前端提供浮動聊天視窗元件，僅 admin 角色可見。聊天視窗固定於頁面右下角，可展開/收合。用戶輸入訊息後，系統透過 RAG 檢索知識庫相關內容，送入 Claude LLM 產生回覆，並以 SSE 串流方式逐字顯示。聊天視窗 SHALL 使用設計系統的 CSS 變數，FAB 按鈕使用 `--color-accent` 色、對話框頭部使用 `--color-primary` 色、用戶氣泡使用 `--color-accent` 色、AI 氣泡使用 `--color-surface` 色。深色模式下所有元件 SHALL 自動適配。品牌名稱 SHALL 統一為「山景旅宿」。

#### Scenario: Admin 開啟聊天視窗
- **WHEN** admin 登入後，於任何頁面點擊右下角聊天按鈕（金色 FAB）
- **THEN** 系統展開聊天視窗，頭部顯示「🏔️ 小山 AI 客服」，顯示歡迎訊息「您好！我是小山，山景旅宿的 AI 客服助理。有什麼可以幫您的嗎？」，輸入框可輸入訊息

#### Scenario: 非 admin 不顯示聊天按鈕
- **WHEN** guest 或匿名訪客瀏覽網站
- **THEN** 頁面不顯示浮動聊天按鈕

#### Scenario: Admin 傳送訊息並收到串流回覆
- **WHEN** admin 在聊天視窗輸入訊息並送出
- **THEN** 系統顯示用戶訊息氣泡（金色背景），隨後以串流方式逐字顯示 AI 回覆（表面色背景）

#### Scenario: 深色模式下的聊天視窗
- **WHEN** 深色模式啟用時開啟聊天視窗
- **THEN** 聊天視窗 SHALL 自動使用深色主題的 CSS 變數，包含頭部、氣泡、輸入區域背景色

#### Scenario: API 回覆失敗
- **WHEN** 聊天 API 發生錯誤（例如外部 API 不可用）
- **THEN** 系統在聊天視窗顯示繁體中文錯誤訊息，用戶可重新輸入
