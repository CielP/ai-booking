## Context

目前 `frontend/src/App.jsx` 以一個 tabs 陣列管理所有頁籤，包含「登入」與「註冊」。Header 右側僅在已登入時顯示用戶資訊。未登入的訪客必須在 tab 列中找到登入/註冊入口，視覺層級與業務功能並排，不符合慣例。

## Goals / Non-Goals

**Goals:**
- 將登入/註冊的 UI 入口從 tab 列移至 header 右上角
- 已登入時 header 右上角維持現有用戶資訊顯示（姓名、角色標籤、登出按鈕）
- 點擊登入/註冊按鈕後仍展開完整頁面（不改用 Modal）

**Non-Goals:**
- 不修改登入/註冊頁面元件本身（Login.jsx、Register.jsx）
- 不修改後端 API 或資料庫
- 不引入 Modal 或 Drawer 等疊層元件

## Decisions

### 決策 1：保留 activeTab 狀態管理，僅改變入口

**選擇**：移除 tabs 陣列中的 `login` / `register`，但保留 `activeTab` 可設為 `'login'` / `'register'`，由 header 按鈕呼叫 `setActiveTab`。

**理由**：現有的頁面渲染邏輯（`activeTab === 'login'` → `<Login />`）完全不需改動，風險最小。

**替代方案**：改用 URL routing（react-router）— 工程量過大，超出本次範圍。

### 決策 2：header 右側統一為一個條件區塊

**選擇**：`!user` 時渲染兩個按鈕（登入、註冊）；`user` 時渲染現有 `.user-info` 區塊，兩者互斥。

**理由**：結構清晰，視覺上對齊，不需新增多餘狀態。

### 決策 3：CSS 新增 `.btn-auth-outline` 類別

**選擇**：「登入」使用 outline 樣式（白底、藍邊框），「註冊」使用 primary 樣式（`.btn-primary`）。

**理由**：視覺上區分兩個動作的優先順序，且複用既有 `.btn-primary`，新增 CSS 最少。

## Risks / Trade-offs

- **登入後 activeTab 殘留問題** → 登入成功後 AuthContext 的 `login()` 已更新 user 狀態，App.jsx 可在 user 改變時重設 activeTab 為 `'available'`（已有此邏輯或可補上）
- **RWD 換行問題** → header 在窄螢幕可能擠壓，`.app-header` 已有 `flex-wrap: wrap`，按鈕會自動換行，可接受

## Migration Plan

1. 修改 `frontend/src/App.jsx`
2. 修改 `frontend/src/index.css`
3. 重新整理 Docker 前端服務（`docker compose up --build -d web`）或直接 Vite hot reload

無 DB migration，無 API 變更，無 rollback 風險。
