## Context

現行系統完全無身份驗證，bookings 僅以 `guest_email` 做弱驗證（取消時比對 email）。本次需在不破壞現有匿名查詢房間功能的前提下，加入 JWT 身份驗證與 RBAC，並同步新增管理者後台。

**受影響 API 端點：**

| 方法 | 路徑 | 變更 |
|------|------|------|
| POST | `/api/auth/register` | 新增 |
| POST | `/api/auth/login` | 新增 |
| POST | `/api/auth/logout` | 新增 |
| GET | `/api/auth/me` | 新增 |
| GET | `/api/rooms/available` | 維持公開 |
| POST | `/api/bookings` | 需要 `requireAuth`；自動帶入 user_id |
| GET | `/api/bookings` | 需要 `requireAuth`；guest 只看自己，admin 看全部 |
| DELETE | `/api/bookings/:id` | 需要 `requireAuth`；guest 只能取消自己的 |
| GET | `/api/admin/users` | 新增，需要 `requireAdmin` |
| PATCH | `/api/admin/users/:id` | 新增，需要 `requireAdmin` |
| DELETE | `/api/admin/users/:id` | 新增，需要 `requireAdmin` |
| GET | `/api/admin/rooms` | 新增，需要 `requireAdmin` |
| PATCH | `/api/admin/rooms/:room_number` | 新增，需要 `requireAdmin` |

**DB Schema 變更：**

```sql
-- 新增 users table
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'guest', -- 'admin' | 'guest'
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- bookings 新增 user_id（可 NULL，相容現有資料）
ALTER TABLE bookings ADD COLUMN user_id UUID REFERENCES users(id);
```

## Goals / Non-Goals

**Goals:**
- 登入/註冊/登出功能，JWT 存於 httpOnly Cookie
- RBAC：admin 與 guest 角色，保護現有訂單 API
- 匿名訪客只能查詢可用房間
- 管理者後台：訂單、帳號、房間管理
- 登入後預訂自動帶入姓名/email

**Non-Goals:**
- OAuth / 第三方登入（Google、Facebook 等）
- Email 驗證流程（信箱確認）
- 密碼重設功能
- Refresh token 機制（單一 JWT，到期重新登入）
- 資料遷移：現有舊訂單的 user_id 維持 NULL

## Decisions

### 1. JWT 存於 httpOnly Cookie（而非 localStorage）

**決定**：使用 `Set-Cookie` 回傳 JWT，前端無法透過 JS 存取。  
**理由**：防止 XSS 攻擊竊取 token，是 OWASP 建議做法。  
**替代方案**：localStorage — 前端操作簡單，但有 XSS 風險，排除。

Cookie 設定：
```
httpOnly: true
secure: false（本機開發）/ true（生產環境）
sameSite: 'lax'
maxAge: JWT_EXPIRES_IN（預設 7 天）
```

Vite proxy 設定需加入 `credentials: 'include'`，前端 fetch 也需同步加上。

### 2. bcryptjs 取代 bcrypt

**決定**：使用 `bcryptjs`（純 JS 實作）。  
**理由**：在 Docker Alpine 環境中避免原生 bindings 編譯問題，無需額外 build 依賴。  
**替代方案**：`bcrypt` — 需 Python/make，Alpine 映像需額外安裝，排除。

### 3. Auth Middleware 分層設計

```
authenticate(req, res, next)
  → 從 cookie 取出 JWT
  → 驗證後 req.user = { id, email, name, role }
  → 驗證失敗則 req.user = null（不強制登入）

requireAuth(req, res, next)
  → 若 req.user 為 null → 401

requireAdmin(req, res, next)
  → 若 req.user.role !== 'admin' → 403
```

`authenticate` 設計為 soft check，讓公開路由也能取得用戶上下文（如未來個人化功能）。

### 4. Admin 帳號由 init.sql Seed

**決定**：`docker/init.sql` 內建 admin 帳號，密碼用 bcrypt hash 後硬編碼，原始密碼存於 `.env` 的 `ADMIN_PASSWORD`。  
**理由**：init.sql 在 db 首次啟動時執行，適合預置初始資料；避免第一次啟動前需要額外步驟。  
**注意**：hash 需在 init.sql 中靜態存入（PostgreSQL 不能執行 Node.js bcrypt），因此 `ADMIN_PASSWORD` 的預設 hash 為事先產生的固定值，可搭配說明文件更換。

### 5. Frontend 使用 AuthContext（無 Redux/Zustand）

**決定**：新增 `AuthContext.jsx`，使用 `useState` + `useEffect` 管理登入狀態。  
**理由**：專案本身不使用狀態管理函式庫，AuthContext 是 React 原生方式，且用戶規模小不需複雜方案。  
**啟動時**：呼叫 `GET /api/auth/me` 初始化用戶狀態（從 cookie 恢復）。

### 6. 動態 Tab 根據登入狀態顯示

| 狀態 | 可見 Tab |
|------|----------|
| 匿名 | 查詢可用房間、登入、註冊 |
| guest | 查詢可用房間、訂房、我的訂單、取消訂單、登出 |
| admin | 查詢可用房間、訂房、我的訂單、取消訂單、管理後台、登出 |

## Risks / Trade-offs

- **[Risk] Cookie 跨域問題** → Vite dev server proxy 已設定 `/api` 轉發，加上 `credentials: 'include'` 與 `withCredentials` 即可解決
- **[Risk] init.sql 中的 bcrypt hash 若 ADMIN_PASSWORD 變更不會自動更新** → 需 `docker compose down -v` 重建 volume；文件中說明此限制
- **[Risk] 舊訂單 user_id 為 NULL** → bookings 的 user_id 設計為 nullable，不影響現有資料；admin 查詢時 JOIN LEFT 即可
- **[Trade-off] 無 Refresh Token** → 7 天 JWT 到期後需重新登入，對小型旅館系統可接受

## Migration Plan

1. 更新 `.env` 與 `.env.example` 加入 `JWT_SECRET`、`JWT_EXPIRES_IN`、`ADMIN_PASSWORD`
2. 修改 `docker/init.sql`（資料庫 volume 需重建）
3. 後端安裝新套件，實作 auth middleware 與新路由
4. 修改現有 bookings 路由加上 auth 保護
5. 前端實作 AuthContext，修改 App.jsx、各頁面
6. 重建 Docker：`docker compose down -v && docker compose up --build -d`

**Rollback**：`git revert`，重建 Docker volume 恢復舊 schema。
