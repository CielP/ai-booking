## MODIFIED Requirements

### Requirement: 頂部 Navbar
系統 SHALL 顯示固定於頂部的 Navbar（sticky），左側顯示品牌名「山景旅宿」（使用 Noto Serif TC 字型），右側顯示主題切換按鈕、用戶資訊（登入後）或登入/註冊按鈕（未登入時）。所有 API 呼叫（如登出）SHALL 使用可配置的 API_BASE 前綴。

#### Scenario: 登出 API 呼叫使用 API_BASE
- **WHEN** 已登入用戶點擊「登出」按鈕
- **THEN** fetch URL SHALL 為 `${API_BASE}/api/auth/logout`

#### Scenario: 未登入用戶看到的 Navbar
- **WHEN** 匿名用戶訪問網站
- **THEN** Navbar 左側顯示「山景旅宿」品牌名，右側顯示主題切換按鈕（🌙/☀️）、「登入」按鈕、「註冊」按鈕

#### Scenario: 已登入用戶看到的 Navbar
- **WHEN** 已登入用戶（guest 或 admin）訪問網站
- **THEN** Navbar 右側顯示主題切換按鈕、用戶姓名、角色徽章（僅 admin）、「登出」按鈕

#### Scenario: Navbar 在深色模式下的顯示
- **WHEN** 深色模式啟用
- **THEN** Navbar 背景色 SHALL 使用 `--color-surface` 變數，文字與按鈕色 SHALL 相應調整
