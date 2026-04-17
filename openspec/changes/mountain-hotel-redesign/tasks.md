## 1. 設計系統基礎與品牌更新

- [x] 1.1 更新 `frontend/index.html`：`lang="zh-TW"`、`<title>山景旅宿</title>`、加入 Google Fonts（Noto Serif TC + Inter）preconnect 與 link、加入 inline script 讀取 localStorage 主題偏好避免閃爍
- [x] 1.2 重構 `frontend/src/index.css`：建立 `:root` 與 `[data-theme="dark"]` CSS 變數（色彩、字型、間距、陰影、圓角、過渡 token），移除所有硬編碼色值改用變數
- [x] 1.3 清除 `frontend/src/App.css` 中未使用的 Vite 模板樣式
- [x] 1.4 更新 `frontend/src/App.jsx` 中兩處「🏨 旅館訂房系統」為「山景旅宿」

## 2. Navbar + Sidebar 佈局重構

- [x] 2.1 重構 `frontend/src/App.jsx`：加入 sticky Navbar（品牌名、主題切換按鈕、用戶資訊/auth 按鈕）
- [x] 2.2 重構 `frontend/src/App.jsx`：加入可收合 Sidebar（導航項目帶 icon，依角色動態顯示，漢堡按鈕切換展開/收合）
- [x] 2.3 加入深色模式 toggle 邏輯：useState 管理主題、寫入 `<html data-theme>`、localStorage 持久化
- [x] 2.4 加入 Sidebar 收合狀態 localStorage 持久化
- [x] 2.5 在 `frontend/src/index.css` 加入 Navbar、Sidebar、main-content 佈局樣式（含 transition 動畫）
- [x] 2.6 加入響應式斷點樣式：桌面 ≥1024px、平板 768-1023px、手機 <768px（手機版 Sidebar 為 overlay + 半透明遮罩）

## 3. Hero 區塊

- [x] 3.1 在 `frontend/src/pages/AvailableRooms.jsx` 搜尋表單上方加入 Hero JSX（CSS 漸層背景 + 品牌標題 + 標語）
- [x] 3.2 在 `frontend/src/index.css` 加入 Hero 樣式（多層漸層、響應式高度、prefers-reduced-motion 支援）

## 4. 元件視覺升級

- [x] 4.1 升級房間卡片樣式：多層陰影、hover translateY 上浮 + 金色邊框光暈、dark mode 適配
- [x] 4.2 升級訂單卡片樣式（MyBookings）：shadow、hover、status badge 配色更新
- [x] 4.3 升級登入/註冊卡片樣式（Login、Register）：置中卡片、Serif 標題、金色 focus 邊框
- [x] 4.4 升級預訂表單樣式（BookRoom）：金色 focus 邊框、按鈕配色更新
- [x] 4.5 升級管理後台樣式（AdminDashboard）：sub-tab、表格 hover、按鈕配色更新

## 5. ChatWidget 主題化

- [x] 5.1 更新 `frontend/src/components/ChatWidget.jsx` 與 `index.css`：FAB 改用 accent 色、對話框頭部用 primary 色、氣泡配色更新、深色模式支援
- [x] 5.2 確認 ChatWidget 品牌文字一致性（「山景旅宿」、「小山 AI 客服」）

## 6. 驗證

- [x] 6.1 搜尋前端原始碼確認無殘留「旅館訂房系統」文字
- [x] 6.2 確認 light/dark 主題切換正常、localStorage 持久化正常
- [x] 6.3 確認 Sidebar 展開/收合正常、手機版 overlay 正常
- [x] 6.4 確認所有頁面功能正常（查詢空房、預訂、我的訂單、管理後台、ChatWidget）
