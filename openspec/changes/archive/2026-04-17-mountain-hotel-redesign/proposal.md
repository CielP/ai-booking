## Why

目前前端採用基礎的 tab 導航與系統預設配色，缺乏旅館品牌識別度與高端感。需要將網站統一為「山景旅宿」品牌，並以藏青 + 金色沉穩風格重新設計整體 UI/UX，提升用戶體驗與專業形象。

## What Changes

- 建立 CSS 變數設計系統（藏青 `#1B2838` + 金色 `#C4A265` 主題色），支援淺色/深色模式切換
- 引入 Google Fonts（Noto Serif TC + Inter）提升排版質感
- 以固定頂部 Navbar + 可收合 Sidebar 取代現有 tab 導航列
- 頁面最大寬度從 800px 擴展至 1200px
- 在「查詢空房」頁面加入 CSS 漸層 Hero 區塊（山景意象 + 品牌標語）
- 全站卡片升級（多層陰影、hover 動畫、金色焦點邊框）
- ChatWidget 配色與品牌一致化
- 所有硬編碼的「旅館訂房系統」文字統一更名為「山景旅宿」
- `<title>` 與 `lang` 屬性更新

## Capabilities

### New Capabilities
- `frontend-design-system`: CSS 變數體系（色彩、字型、間距、陰影 token），支援 light/dark 主題切換，localStorage 持久化偏好
- `frontend-layout`: 頂部 Navbar + 可收合 Sidebar 導航佈局，響應式斷點（桌面/平板/手機），取代現有 tab 列
- `hero-section`: 「查詢空房」頁面的 CSS 漸層 Hero 橫幅，展示品牌名稱與標語

### Modified Capabilities
- `ai-chatbot`: ChatWidget 配色與品牌名稱更新為山景旅宿主題（FAB、對話框頭部、氣泡配色、深色模式支援）

## Impact

- **前端檔案**: `index.html`、`App.jsx`、`App.css`、`index.css`、所有 pages/*.jsx、`ChatWidget.jsx`
- **新增檔案**: 可能新增 `ThemeContext.jsx`（深色模式狀態管理）
- **依賴**: 新增 Google Fonts CDN 連結（Noto Serif TC、Inter）
- **後端**: 無影響
- **資料庫**: 無影響
