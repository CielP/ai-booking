## 1. 專案初始化與 Docker 設定

- [x] 1.1 建立根目錄結構：`backend/`、`frontend/`、`docker/`
- [x] 1.2 建立 `.env.example`，定義 DB_USER、DB_PASSWORD、DB_NAME、PGADMIN_EMAIL、PGADMIN_PASSWORD
- [x] 1.3 建立 `docker-compose.yml`，定義 db（postgres:16-alpine）、pgadmin、api、web 四個服務
- [x] 1.4 建立 `docker/init.sql`：建立 `rooms` 與 `bookings` 資料表，seed 5 間房間資料
- [x] 1.5 驗證 `docker compose up` 可成功啟動所有服務，pgAdmin 可於 localhost:5050 登入

## 2. 後端 Express API

- [x] 2.1 初始化 `backend/` Node.js 專案，安裝 express、pg、dotenv、cors
- [x] 2.2 建立 `backend/src/db.js`：PostgreSQL 連線池設定（使用 `pg.Pool`）
- [x] 2.3 實作 `GET /api/rooms/available`：依 check_in/check_out 查詢可用房間，含日期驗證
- [x] 2.4 實作 `POST /api/bookings`：驗證必填欄位、Email 格式、房間存在性，執行衝突檢查（transaction），建立訂單
- [x] 2.5 實作 `GET /api/bookings?email=xxx`：以 Email 查詢所有訂單，依 check_in 排序
- [x] 2.6 實作 `DELETE /api/bookings/:id`：驗證 Email 對應，將訂單狀態改為 cancelled
- [x] 2.7 加入全域錯誤處理 middleware，統一回應 `{ "error": "<message>" }` 格式
- [x] 2.8 建立 `backend/Dockerfile`（Node.js 20-alpine）

## 3. 前端 React 應用

- [x] 3.1 以 Vite 初始化 `frontend/` React 專案，設定 `/api` proxy 指向 backend
- [x] 3.2 建立主要 App 元件，實作 tab 或路由切換四個功能頁面
- [x] 3.3 實作「查詢空房」頁面：日期選擇器、送出查詢、顯示可用房間清單
- [x] 3.4 實作「預訂房間」頁面：填寫表單（姓名/Email/備注/房間/日期）、送出後顯示訂單編號
- [x] 3.5 實作「查詢訂單」頁面：輸入 Email、顯示訂單列表（含狀態標示）
- [x] 3.6 實作「取消訂單」頁面：輸入訂單編號 + Email、確認取消、顯示結果
- [x] 3.7 加入基本表單驗證（必填欄位、Email 格式、日期邏輯）
- [x] 3.8 加入 loading 狀態與錯誤訊息顯示（繁體中文）
- [x] 3.9 建立 `frontend/Dockerfile`（Node.js 20-alpine，執行 Vite dev server）

## 4. 整合驗證

- [x] 4.1 以瀏覽器測試查詢空房功能（含無空房情境）
- [x] 4.2 以瀏覽器測試完整預訂流程（選房 → 填表 → 取得訂單編號）
- [x] 4.3 以瀏覽器測試查詢訂單（以 Email 查詢，確認訂單列表正確）
- [x] 4.4 以瀏覽器測試取消訂單（Email 驗證正確/錯誤兩種情境）
- [x] 4.5 測試重複預訂同一房間同一日期，確認系統回傳 409 衝突錯誤
- [x] 4.6 確認 pgAdmin 可連線並瀏覽 rooms 與 bookings 資料表
