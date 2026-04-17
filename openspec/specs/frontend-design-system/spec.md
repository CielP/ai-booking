# Frontend Design System

## Purpose

定義前端設計系統的行為規格，包含 CSS 變數 token、主題切換（light/dark）、字型載入、元件視覺升級。

## Requirements

### Requirement: CSS 變數設計系統
系統 SHALL 以 CSS Custom Properties 定義完整的設計 token，包含色彩、字型、間距、陰影、圓角及過渡動畫 token。所有元件樣式 SHALL 使用這些變數而非硬編碼值。

#### Scenario: Light 主題預設載入
- **WHEN** 用戶首次訪問網站且 localStorage 無主題偏好
- **THEN** 系統以 light 主題渲染（藏青 `#1B2838` 主色、金色 `#C4A265` 強調色、暖白 `#F8F6F1` 背景）

#### Scenario: 切換至 Dark 主題
- **WHEN** 用戶點擊 Navbar 中的主題切換按鈕
- **THEN** `<html>` 元素的 `data-theme` 屬性設為 `"dark"`，全站即時切換為深色配色（深藏青 `#0F1923` 背景、`#1B2838` 表面色、`#E8E2D8` 文字色）

#### Scenario: 主題偏好持久化
- **WHEN** 用戶切換主題後關閉瀏覽器，重新開啟網站
- **THEN** 系統從 localStorage 讀取偏好，頁面載入時即套用對應主題，無閃爍

#### Scenario: CSS 變數未定義時的降級
- **WHEN** 瀏覽器不支援 CSS Custom Properties（極舊瀏覽器）
- **THEN** 元件樣式 SHALL 提供 fallback 值作為降級顯示

### Requirement: 字型載入
系統 SHALL 透過 Google Fonts CDN 載入 Noto Serif TC（中文標題字型）與 Inter（英文/內文字型），並使用 `font-display: swap` 避免文字隱形。

#### Scenario: 字型正常載入
- **WHEN** Google Fonts CDN 可用
- **THEN** 標題使用 Noto Serif TC 渲染，內文使用 Inter 渲染

#### Scenario: 字型載入失敗
- **WHEN** Google Fonts CDN 不可用
- **THEN** 系統 SHALL 降級為系統預設字型（-apple-system, sans-serif），頁面仍可正常使用

### Requirement: 元件視覺升級
所有卡片元件 SHALL 使用多層 box-shadow、hover 時 translateY 上浮動畫、以及使用 `--color-accent` 的焦點邊框。表單 input focus 狀態 SHALL 使用金色邊框。按鈕 SHALL 使用設計系統的 accent 色彩。

#### Scenario: 卡片 hover 效果
- **WHEN** 用戶將滑鼠移至房間卡片上
- **THEN** 卡片 SHALL 上浮 2-4px 並增加陰影深度，transition 時間 200-300ms

#### Scenario: 深色模式下的元件
- **WHEN** 深色模式啟用時
- **THEN** 所有卡片、表格、表單的背景色、文字色、邊框色 SHALL 使用對應的 dark 主題 CSS 變數
