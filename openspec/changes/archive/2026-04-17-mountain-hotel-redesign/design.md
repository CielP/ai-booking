## Context

目前前端為單一 `App.jsx` 管理所有頁面，採用 tab 導航，樣式全部集中在 `index.css`，使用硬編碼色值（主要為 `#2563eb` 藍色系），無品牌識別。頁面最大寬度 800px，無深色模式支援。字型使用系統預設（-apple-system 等）。

本次變更為純前端 UI/UX 重構，不涉及後端 API 或資料庫 schema 變更。所有 API 端點保持不變。

## Goals / Non-Goals

**Goals:**
- 建立以 CSS Custom Properties 為基礎的設計系統，統一色彩、字型、間距 token
- 支援 light / dark 主題切換，偏好持久化至 localStorage
- 以 Navbar + 可收合 Sidebar 取代 tab 導航，提升導航體驗
- 在查詢空房頁面加入 CSS 漸層 Hero 區塊，強化品牌印象
- 全站視覺升級（卡片、表單、按鈕、徽章等元件）
- 統一品牌名為「山景旅宿」

**Non-Goals:**
- 不引入 CSS 框架（Tailwind、Bootstrap 等），維持純 CSS
- 不引入前端路由（React Router），維持現有 state-based 導航
- 不引入狀態管理庫（Redux、Zustand 等）
- 不修改後端 API 端點、資料庫 schema
- 不變更功能行為（登入、訂房、取消等業務邏輯不變）
- 不引入圖片素材（Hero 使用純 CSS 漸層）

## Decisions

### 1. CSS Custom Properties 設計系統（不引入 CSS 框架）

**選擇**: 以 `:root` / `[data-theme="dark"]` 定義 CSS 變數 token

**理由**: 專案慣例為純 CSS，無需引入建構工具或框架。CSS Custom Properties 原生支援主題切換且零 runtime 成本。

**替代方案**: 引入 Tailwind CSS — 需改動所有 JSX、增加 PostCSS 設定、學習成本高，不符合專案慣例。

**色彩 token**:
- `--color-primary`: `#1B2838`（藏青，主品牌色）
- `--color-accent`: `#C4A265`（金色，強調色、CTA）
- `--color-bg`: `#F8F6F1`（暖白，light 背景）/ `#0F1923`（深藏青，dark 背景）
- `--color-surface`: `#FFFFFF` / `#1B2838`
- `--color-text`: `#2C3E50` / `#E8E2D8`
- `--color-text-secondary`: `#6B7B8D` / `#8B9DAF`
- `--color-border`: `#D4CFC7` / `#2D4A5C`

### 2. 主題切換機制

**選擇**: `<html data-theme="dark">` + localStorage + React state

**理由**: `data-theme` 屬性選擇器搭配 CSS 變數可零 JS 開銷切換全站主題。localStorage 在 HTML 初始化前讀取可避免閃爍（在 index.html 的 inline script 中）。React state 同步 UI 的 toggle 按鈕狀態。

**替代方案**: 新增 ThemeContext — 增加元件樹複雜度，且主題切換本質是 DOM 屬性操作不需 context。直接在 App.jsx 用 useState 管理即可。

### 3. Navbar + 可收合 Sidebar 導航

**選擇**: 頂部 sticky Navbar + 左側 Sidebar，Sidebar 預設收合、點擊漢堡選單展開

**結構**:
```
┌──────────── Navbar (sticky top) ────────────────┐
│ 🏔 山景旅宿     [🌙] [用戶名] [管理者] [登出]  │
├────┬────────────────────────────────────────────┤
│ S  │                                            │
│ i  │           Main Content                     │
│ d  │           (max-width: 1200px area)         │
│ e  │                                            │
│ b  │                                            │
│ a  │                                            │
│ r  │                                            │
└────┴────────────────────────────────────────────┘
```

**Sidebar 行為**:
- 預設收合（僅顯示 icon，寬度 60px）
- 點擊漢堡按鈕展開（顯示 icon + 文字，寬度 220px）
- 手機版（<768px）：完全隱藏，漢堡按鈕展開為 overlay
- Sidebar 狀態持久化至 localStorage

**理由**: 可收合 Sidebar 比 tab 列提供更好的可擴展性和視覺層次，同時預設收合不佔空間。

**替代方案**: 維持 tab 導航 — 無法達成「大幅重設計」目標。固定展開 Sidebar — 在窄螢幕上佔據過多空間。

### 4. 字型選擇

**選擇**: Noto Serif TC（中文標題）+ Inter（英文/內文）

**理由**: Noto Serif TC 為 Google 提供的免費襯線中文字型，典雅且支援完整繁體中文字集。Inter 為現代無襯線字型，可讀性極佳。

**載入方式**: Google Fonts CDN link 於 index.html `<head>` 引入，僅載入必要字重（400, 600, 700）。

### 5. Hero 區塊實作

**選擇**: CSS 多層漸層模擬山景剪影 + 品牌文字 overlay

**理由**: 純 CSS 實作無需額外資源請求，載入速度快。漸層從深藍（天空）→ 墨綠（山巒）→ 微金（地平線光暈），符合「山景」意象。

## Risks / Trade-offs

- **[字型載入延遲]** → Google Fonts CDN 可能增加初始載入時間。
  - **緩解**: 使用 `font-display: swap`，在字型載入前以系統字型顯示，避免 FOIT。
  - 在 `<link>` 加入 `preconnect` 到 fonts.googleapis.com。

- **[深色模式首次閃爍]** → React hydration 前可能短暫顯示 light 主題。
  - **緩解**: 在 index.html `<head>` 加入 inline script 讀取 localStorage 並設定 `data-theme`，早於 React 初始化。

- **[Sidebar 複雜度]** → 新增 Sidebar 增加了 App.jsx 的 JSX 複雜度。
  - **緩解**: 保持 Sidebar 邏輯簡單（useState for collapsed state），不抽取為獨立元件除非必要。

- **[CSS 檔案大小增長]** → 新增 dark mode 變數和 layout 樣式會增加 index.css 體積。
  - **緩解**: 刪除 App.css 中未使用的 Vite 模板樣式，淨增量可控。
