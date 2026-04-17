## ADDED Requirements

### Requirement: 頂部 Navbar
系統 SHALL 顯示固定於頂部的 Navbar（sticky），左側顯示品牌名「山景旅宿」（使用 Noto Serif TC 字型），右側顯示主題切換按鈕、用戶資訊（登入後）或登入/註冊按鈕（未登入時）。

#### Scenario: 未登入用戶看到的 Navbar
- **WHEN** 匿名用戶訪問網站
- **THEN** Navbar 左側顯示「山景旅宿」品牌名，右側顯示主題切換按鈕（🌙/☀️）、「登入」按鈕、「註冊」按鈕

#### Scenario: 已登入用戶看到的 Navbar
- **WHEN** 已登入用戶（guest 或 admin）訪問網站
- **THEN** Navbar 右側顯示主題切換按鈕、用戶姓名、角色徽章（僅 admin）、「登出」按鈕

#### Scenario: Navbar 在深色模式下的顯示
- **WHEN** 深色模式啟用
- **THEN** Navbar 背景色 SHALL 使用 `--color-surface` 變數，文字與按鈕色 SHALL 相應調整

### Requirement: 可收合 Sidebar 導航
系統 SHALL 在 Navbar 下方左側顯示垂直 Sidebar，包含導航項目（依角色動態顯示），可透過漢堡按鈕切換展開/收合。

#### Scenario: Sidebar 預設收合狀態
- **WHEN** 頁面載入且 localStorage 無 Sidebar 偏好
- **THEN** Sidebar 以收合狀態顯示（僅顯示 icon，寬度約 60px），主內容區佔據其餘寬度

#### Scenario: 展開 Sidebar
- **WHEN** 用戶點擊漢堡按鈕（☰）
- **THEN** Sidebar 以動畫展開至約 220px 寬，顯示 icon + 導航文字標籤

#### Scenario: Sidebar 導航項目依角色顯示
- **WHEN** 匿名用戶訪問
- **THEN** Sidebar 僅顯示「查詢空房」
- **WHEN** guest 用戶訪問
- **THEN** Sidebar 顯示「查詢空房」「預訂房間」「我的訂單」
- **WHEN** admin 用戶訪問
- **THEN** Sidebar 顯示「查詢空房」「預訂房間」「我的訂單」「管理後台」

#### Scenario: 手機版 Sidebar
- **WHEN** 螢幕寬度 < 768px
- **THEN** Sidebar 預設隱藏，漢堡按鈕存在於 Navbar 左側，點擊後 Sidebar 以 overlay 方式滑入，帶有半透明遮罩

#### Scenario: 導航項目點擊
- **WHEN** 用戶點擊 Sidebar 中的導航項目
- **THEN** 主內容區切換至對應頁面，目前項目以 accent 色標示為 active 狀態

### Requirement: 響應式主內容區
主內容區 SHALL 位於 Sidebar 右側、Navbar 下方，最大寬度為 1200px，水平置中。

#### Scenario: 桌面版佈局
- **WHEN** 螢幕寬度 ≥ 1024px
- **THEN** 主內容區寬度 = 視窗寬度 - Sidebar 寬度，最大 1200px，水平置中

#### Scenario: Sidebar 收合時的內容區
- **WHEN** Sidebar 處於收合狀態
- **THEN** 主內容區 SHALL 平滑擴展以填充 Sidebar 釋放的空間

### Requirement: 品牌文字統一
全站所有出現「旅館訂房系統」的文字 SHALL 替換為「山景旅宿」。`<title>` 標籤 SHALL 設為「山景旅宿」。`<html>` 的 `lang` 屬性 SHALL 設為 `zh-TW`。

#### Scenario: 網頁標題顯示
- **WHEN** 用戶在瀏覽器中開啟網站
- **THEN** 瀏覽器標籤顯示「山景旅宿」

#### Scenario: 品牌名顯示一致性
- **WHEN** 搜尋前端原始碼中的「旅館訂房系統」
- **THEN** SHALL 回傳 0 筆結果
