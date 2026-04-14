## 1. 環境與資料庫準備

- [x] 1.1 在 `.env.example` 新增 `JWT_SECRET`、`JWT_EXPIRES_IN`、`ADMIN_PASSWORD` 三個環境變數（附說明註解）
- [x] 1.2 在 `.env` 填入對應的本機開發值（JWT_SECRET 隨機字串、JWT_EXPIRES_IN=7d、ADMIN_PASSWORD 自訂）
- [x] 1.3 修改 `docker/init.sql`：新增 `users` 資料表（id, email, password_hash, name, role, is_active, created_at）
- [x] 1.4 修改 `docker/init.sql`：在 `bookings` 資料表新增 `user_id UUID REFERENCES users(id)` 欄位（可 NULL）
- [x] 1.5 修改 `docker/init.sql`：INSERT admin seed 帳號（使用預先產生的 bcrypt hash，對應 ADMIN_PASSWORD 預設值）

## 2. Backend 套件與基礎設定

- [x] 2.1 在 `backend/` 執行 `npm install bcryptjs jsonwebtoken cookie-parser`，確認 `package.json` 已更新
- [x] 2.2 在 `backend/src/index.js` 引入並掛載 `cookie-parser` middleware（app.use 順序：cors → cookie-parser → express.json）

## 3. Auth Middleware

- [x] 3.1 新增 `backend/src/middleware/auth.js`：實作 `authenticate(req, res, next)` — 從 `req.cookies.token` 取出 JWT，驗證後設 `req.user`，失敗則 `req.user = null`
- [x] 3.2 在 `auth.js` 實作 `requireAuth(req, res, next)` — 若 `req.user` 為 null 則回傳 401 `{ error: '請先登入' }`
- [x] 3.3 在 `auth.js` 實作 `requireAdmin(req, res, next)` — 若 `req.user.role !== 'admin'` 則回傳 403 `{ error: '需要管理者權限' }`

## 4. Auth 路由

- [x] 4.1 新增 `backend/src/routes/auth.js`：實作 `POST /register` — 驗證欄位、bcrypt hash 密碼、INSERT users、回傳 JWT Cookie + 用戶資料
- [x] 4.2 在 `auth.js` 實作 `POST /login` — 查詢 user by email、bcrypt compare、確認 is_active、回傳 JWT Cookie + 用戶資料
- [x] 4.3 在 `auth.js` 實作 `POST /logout` — 清除 Cookie（maxAge=0），回傳 200
- [x] 4.4 在 `auth.js` 實作 `GET /me` — 使用 `authenticate` middleware，回傳 `req.user` 或 401
- [x] 4.5 在 `backend/src/index.js` 掛載 auth 路由：`app.use('/api/auth', authRouter)`

## 5. 修改現有 Bookings 路由

- [x] 5.1 在 `backend/src/routes/bookings.js` 的 `POST /` 加上 `requireAuth` middleware；改由 `req.user` 取得 guest_name/guest_email，並將 `user_id` 寫入訂單
- [x] 5.2 在 `GET /` 加上 `requireAuth`；若 `req.user.role === 'admin'` 回傳所有訂單，否則只回傳 `user_id = req.user.id` 的訂單（移除原 `?email=` 查詢參數邏輯）
- [x] 5.3 在 `DELETE /:id` 加上 `requireAuth`；若 `req.user.role === 'admin'` 略過 owner 驗證，否則比對 `bookings.user_id === req.user.id`，不符則回傳 403

## 6. Admin 路由

- [x] 6.1 新增 `backend/src/routes/admin.js`：`GET /users` — 使用 `requireAdmin`，回傳所有 users 清單（不含 password_hash）
- [x] 6.2 在 `admin.js` 實作 `PATCH /users/:id` — 更新 role 或 is_active；禁止 admin 停用自己（回傳 400）
- [x] 6.3 在 `admin.js` 實作 `DELETE /users/:id` — 軟刪除：設 `is_active = false`（同上，禁止自我停用）
- [x] 6.4 在 `admin.js` 實作 `GET /rooms` — 回傳所有 rooms 清單
- [x] 6.5 在 `admin.js` 實作 `PATCH /rooms/:room_number` — 更新 description；房間不存在回傳 404
- [x] 6.6 在 `backend/src/index.js` 掛載 admin 路由：`app.use('/api/admin', adminRouter)`

## 7. Frontend：AuthContext 與 App 骨架

- [x] 7.1 新增 `frontend/src/context/AuthContext.jsx`：以 `createContext` + `useState` 管理 `user` 狀態；提供 `login(userData)`、`logout()` 函式；在 `useEffect` 中呼叫 `GET /api/auth/me` 初始化狀態
- [x] 7.2 修改 `frontend/src/main.jsx`（或 `App.jsx`）：以 `AuthProvider` 包裹整個應用
- [x] 7.3 修改 `frontend/src/App.jsx`：根據 `user` 狀態動態顯示 tab（匿名：查詢+登入+註冊；guest：查詢+預訂+我的訂單+取消+登出；admin 再加管理後台）
- [x] 7.4 在 `App.jsx` 加入登出按鈕，呼叫 `POST /api/auth/logout` 後執行 `logout()` 清除 AuthContext

## 8. Frontend：登入與註冊頁面

- [x] 8.1 新增 `frontend/src/pages/Login.jsx`：表單含 Email/密碼，呼叫 `POST /api/auth/login`，成功後呼叫 `login(userData)` 更新 AuthContext，切換至查詢頁
- [x] 8.2 新增 `frontend/src/pages/Register.jsx`：表單含姓名/Email/密碼，呼叫 `POST /api/auth/register`，成功後呼叫 `login(userData)` 更新 AuthContext
- [x] 8.3 在 `frontend/src/index.css` 補充登入/註冊頁面的樣式（與現有表單風格一致）

## 9. Frontend：修改現有頁面

- [x] 9.1 修改 `frontend/src/pages/BookRoom.jsx`：從 `AuthContext` 讀取 `user.name` / `user.email` 填入欄位（唯讀），移除手動輸入姓名/email 的欄位
- [x] 9.2 修改 `frontend/src/pages/MyBookings.jsx`：移除 email input 欄位，改為在 `useEffect` 直接呼叫 `GET /api/bookings`（帶 cookie），fetch 需加 `credentials: 'include'`
- [x] 9.3 修改 `frontend/src/pages/CancelBooking.jsx`：移除 email 驗證邏輯，改為直接呼叫 `DELETE /api/bookings/:id`（帶 cookie），fetch 需加 `credentials: 'include'`

## 10. Frontend：管理者後台

- [x] 10.1 新增 `frontend/src/pages/AdminDashboard.jsx`：包含「訂單管理」/「帳號管理」/「房間管理」三個子分頁的 tab 切換骨架
- [x] 10.2 在 `AdminDashboard.jsx` 實作「訂單管理」：呼叫 `GET /api/bookings` 顯示所有訂單，可點擊「取消」按鈕呼叫 `DELETE /api/bookings/:id`
- [x] 10.3 在 `AdminDashboard.jsx` 實作「帳號管理」：呼叫 `GET /api/admin/users` 列出帳號，可修改 role 與 is_active（呼叫 `PATCH /api/admin/users/:id`）
- [x] 10.4 在 `AdminDashboard.jsx` 實作「房間管理」：呼叫 `GET /api/admin/rooms` 列出房間，可編輯描述並儲存（呼叫 `PATCH /api/admin/rooms/:room_number`）
- [x] 10.5 在 `frontend/src/index.css` 補充管理後台的樣式（表格、子分頁切換）

## 11. Vite Proxy 設定

- [x] 11.1 確認 `frontend/vite.config.js` 的 proxy 設定包含 `changeOrigin: true`；確認所有 fetch 呼叫受保護路由時有加 `credentials: 'include'`

## 12. 整合驗證

- [x] 12.1 執行 `docker compose down -v && docker compose up --build -d`，確認資料庫以新 schema 初始化，admin seed 帳號存在
- [x] 12.2 驗證匿名訪客只看到「查詢可用房間」tab，嘗試存取 POST /api/bookings 回傳 401
- [x] 12.3 用 Register 頁面建立 guest 帳號，登入後確認 tab 顯示正確，BookRoom 表單自動帶入姓名/email
- [x] 12.4 用 admin 帳號登入，確認「管理後台」tab 出現，可查看所有訂單並取消
- [x] 12.5 用 guest 帳號嘗試呼叫 GET /api/admin/users，確認回傳 403
