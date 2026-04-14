## Why

目前系統完全沒有身份驗證，任何人只要知道 email 即可查詢、取消他人訂單，無法區分管理者與一般旅客。需要加入登入系統與角色權限管理，確保資料安全並提供管理者後台功能。

## What Changes

- **新增** 使用者帳號系統：公開自行註冊（guest 角色），admin 帳號由 init.sql seed
- **新增** JWT 身份驗證：token 存於 httpOnly Cookie，防止 XSS 竊取
- **新增** RBAC 角色控制：`admin`（管理者）與 `guest`（一般用戶）兩種角色
- **修改** 匿名訪客權限：僅能查詢可用房間，其餘操作需登入
- **修改** 訂房流程：登入後自動帶入姓名/email，不須手動輸入
- **修改** 我的訂單：改用 JWT 識別，不再要求輸入 email
- **修改** 取消訂單：改用 JWT 驗證身份，guest 只能取消自己的訂單
- **新增** 管理者後台：查看所有訂單、取消任何訂單、管理帳號、管理房間資訊
- **修改** bookings 資料表：新增 `user_id` 欄位關聯至 users

## Capabilities

### New Capabilities
- `user-auth`: 使用者註冊、登入、登出，JWT httpOnly Cookie 管理，取得目前登入用戶資訊
- `rbac`: 角色型存取控制，定義 admin/guest 角色及對應的 API 保護規則
- `admin-dashboard`: 管理者後台，涵蓋所有訂單管理、用戶帳號管理、房間資訊管理

### Modified Capabilities
- `room-booking`: 預訂房間需要登入，姓名/email 自動帶入，bookings 新增 user_id
- `booking-management`: 查詢與取消訂單改為基於 JWT 身份，guest 只能操作自己的訂單

## Impact

- **DB**：新增 `users` table；`bookings` 新增 `user_id FK`；`docker/init.sql` 加入 admin seed
- **Backend**：新增 `bcryptjs`、`jsonwebtoken`、`cookie-parser` 套件；新增 auth/admin 路由；新增 auth middleware；修改 bookings 路由加上權限保護
- **Frontend**：新增 AuthContext、Login/Register/AdminDashboard 頁面；修改 App.jsx、BookRoom、MyBookings、CancelBooking
- **環境變數**：`.env` 新增 `JWT_SECRET`、`JWT_EXPIRES_IN`、`ADMIN_PASSWORD`
