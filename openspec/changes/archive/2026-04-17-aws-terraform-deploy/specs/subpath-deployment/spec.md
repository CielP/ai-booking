## ADDED Requirements

### Requirement: Nginx 子路徑靜態檔案服務
Nginx SHALL 在 `/mountain-lodge/` 路徑下提供 Vite 建構輸出的靜態檔案，所有未匹配的路徑 SHALL 回傳 `index.html`（SPA fallback）。

#### Scenario: 存取首頁
- **WHEN** 瀏覽器存取 `/mountain-lodge/`
- **THEN** Nginx SHALL 回傳 Vite 建構的 `index.html`，HTTP 200

#### Scenario: 存取靜態資源
- **WHEN** 瀏覽器存取 `/mountain-lodge/assets/index-abc123.js`
- **THEN** Nginx SHALL 回傳對應的靜態檔案，帶有正確的 Content-Type

#### Scenario: SPA 路由 fallback
- **WHEN** 瀏覽器存取 `/mountain-lodge/any-path`（非靜態檔案）
- **THEN** Nginx SHALL 回傳 `index.html`，讓前端 React 處理路由

#### Scenario: 存取根路徑重導向
- **WHEN** 瀏覽器存取 `/mountain-lodge`（無尾部斜線）
- **THEN** Nginx SHALL 重導向至 `/mountain-lodge/`

### Requirement: Nginx API 反向代理
Nginx SHALL 將 `/mountain-lodge/api/*` 請求轉發至 `localhost:3000/api/*`，剝離 `/mountain-lodge` 前綴。

#### Scenario: API 請求轉發成功
- **WHEN** 前端發送 `GET /mountain-lodge/api/rooms/available?check_in=2026-05-01&check_out=2026-05-03`
- **THEN** Nginx SHALL 轉發為 `GET http://localhost:3000/api/rooms/available?check_in=2026-05-01&check_out=2026-05-03` 至 Node.js

#### Scenario: API POST 請求正確轉發
- **WHEN** 前端發送 `POST /mountain-lodge/api/auth/login`，body 為 JSON
- **THEN** Nginx SHALL 將 request body 完整轉發至 `http://localhost:3000/api/auth/login`

#### Scenario: SSE 串流正確傳遞
- **WHEN** 前端發送 `POST /mountain-lodge/api/chat`（SSE 串流）
- **THEN** Nginx SHALL 關閉 proxy_buffering，確保 SSE 事件即時傳遞至客戶端

#### Scenario: Cookie 正確傳遞
- **WHEN** 後端回傳 Set-Cookie header（httpOnly JWT token）
- **THEN** Nginx SHALL 完整傳遞 Set-Cookie header 至客戶端，cookie path 為 `/`

### Requirement: 前端 API 基礎路徑可配置
前端 SHALL 支援透過 `VITE_API_BASE` 環境變數配置 API 請求的基礎路徑前綴。所有 fetch 呼叫 SHALL 使用此前綴。

#### Scenario: 生產環境使用子路徑
- **WHEN** 建構時設定 `VITE_API_BASE=/mountain-lodge`
- **THEN** 所有 API fetch 呼叫 SHALL 使用 `/mountain-lodge/api/*` 路徑

#### Scenario: 開發環境維持原路徑
- **WHEN** 未設定 `VITE_API_BASE`（預設空字串）
- **THEN** 所有 API fetch 呼叫 SHALL 維持 `/api/*` 路徑，Vite proxy 正常運作

#### Scenario: AuthContext fetch 使用 API_BASE
- **WHEN** AuthContext 載入時呼叫 `/api/auth/me`
- **THEN** 實際 fetch URL SHALL 為 `${API_BASE}/api/auth/me`

### Requirement: Vite 生產建構子路徑
Vite 建構 SHALL 支援透過環境變數設定 `base` 路徑，使靜態資源引用包含正確的子路徑前綴。

#### Scenario: 生產建構設定 base
- **WHEN** 以 `VITE_BASE=/mountain-lodge/` 執行 `npm run build`
- **THEN** 建構輸出的 HTML 中，所有 script/link 標籤的 src/href SHALL 以 `/mountain-lodge/` 為前綴

#### Scenario: 開發環境不設定 base
- **WHEN** 以預設設定執行 `npm run dev`
- **THEN** Vite 開發伺服器 SHALL 維持 `/` 作為 base path

### Requirement: 前端生產 Dockerfile
系統 SHALL 提供 `frontend/Dockerfile.prod`，使用多階段建構（Vite build → Nginx），產出輕量化生產映像。

#### Scenario: 多階段建構成功
- **WHEN** 執行 `docker build -f Dockerfile.prod --build-arg VITE_API_BASE=/mountain-lodge --build-arg VITE_BASE=/mountain-lodge/ .`
- **THEN** 產出的映像 SHALL 包含 Nginx 與 Vite 建構輸出的靜態檔案，映像大小 SHALL 小於 50MB

#### Scenario: Dockerfile.prod 不影響原 Dockerfile
- **WHEN** 執行 `docker compose up --build`（使用原 Dockerfile）
- **THEN** 本機開發環境 SHALL 維持不變，使用 Vite 開發伺服器
