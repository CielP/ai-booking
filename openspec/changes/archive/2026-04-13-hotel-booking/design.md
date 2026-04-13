## Context

旅館目前無線上訂房系統，本次全新建置。系統為單一旅館使用，5 間同房型房間（101–105），無多租戶需求。技術選型由使用者指定：React + Express + PostgreSQL，以 Docker Compose 部署。

## Goals / Non-Goals

**Goals:**
- 旅客可查詢空房、建立訂單、查詢訂單、取消訂單
- 系統以 Docker Compose 一鍵啟動（db、pgadmin、api、web）
- pgAdmin 提供旅館人員直接操作資料庫

**Non-Goals:**
- 使用者帳號系統（登入/註冊）
- 金流整合（付款）
- 後台管理介面（Admin UI）
- 多語言切換
- 房間照片/設施介紹

## Decisions

### 1. 資料庫 Schema

**`rooms` 表**（靜態資料，初始化時 seed）：
```sql
CREATE TABLE rooms (
  room_number  INT PRIMARY KEY,  -- 101–105
  description  TEXT
);
```

**`bookings` 表**：
```sql
CREATE TABLE bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number  INT NOT NULL REFERENCES rooms(room_number),
  guest_name   VARCHAR(100) NOT NULL,
  guest_email  VARCHAR(255) NOT NULL,
  check_in     DATE NOT NULL,
  check_out    DATE NOT NULL,
  notes        TEXT,
  status       VARCHAR(20) NOT NULL DEFAULT 'active',  -- active | cancelled
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_dates CHECK (check_out > check_in)
);
CREATE INDEX idx_bookings_email ON bookings(guest_email);
CREATE INDEX idx_bookings_room_dates ON bookings(room_number, check_in, check_out);
```

**日期重疊判斷**：訂單衝突條件為 `check_in < existing.check_out AND check_out > existing.check_in`（排除相鄰日期，即退房日 = 入住日視為不衝突）。

### 2. API 路由（Express RESTful）

| Method | Path | 說明 |
|--------|------|------|
| `GET` | `/api/rooms/available?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD` | 查詢可用房間 |
| `POST` | `/api/bookings` | 建立訂單 |
| `GET` | `/api/bookings?email=xxx` | 以 Email 查詢訂單 |
| `DELETE` | `/api/bookings/:id` | 取消訂單（body 需帶 email 驗證） |

回應格式統一為 JSON，錯誤格式：`{ "error": "<message>" }`。

### 3. 前端架構（React + Vite）

單頁應用，以 React Router 或 tab 切換四個功能頁面：

- **查詢空房**：日期選擇器 → 顯示可用房間清單 → 點選房間導向預訂
- **預訂房間**：填寫姓名/Email/備注/選擇房間/日期 → 送出 → 顯示訂單編號
- **查詢訂單**：輸入 Email → 顯示訂單列表（含狀態）
- **取消訂單**：輸入訂單編號 + Email → 確認取消

狀態管理：React useState/useEffect（不需 Redux，規模小）。  
HTTP 請求：原生 fetch 或 axios。  
UI 元件庫：無強制，使用基礎 CSS + Tailwind CSS（或純 CSS）保持輕量。

### 4. Docker Compose 服務

```yaml
services:
  db:        # postgres:16-alpine
  pgadmin:   # dpage/pgadmin4，port 5050
  api:       # Node.js 20, port 3000，掛載 ./backend
  web:       # Node.js 20 (Vite dev server), port 5173，掛載 ./frontend
```

資料庫連線透過 Docker 內部網路（`db:5432`），不對外暴露 5432 port。  
環境變數透過 `.env` 管理（DB 帳密、pgAdmin 帳密）。  
初始化 SQL（seed rooms）放於 `docker-entrypoint-initdb.d/`。

### 5. 資料驗證策略

後端 Express 使用 `express-validator` 或手動驗證於 route handler 中：
- 日期格式 `YYYY-MM-DD`，退房 > 入住
- Email 格式驗證（regex 或 validator.js）
- 房間號碼必須在 101–105 範圍

前端進行基本 UX 驗證（即時 feedback），後端為唯一信任邊界。

## Risks / Trade-offs

- **併發衝突（Race Condition）**：兩位旅客同時預訂同一房間可能導致雙重預訂。  
  → Mitigation：在 `INSERT` 前使用 PostgreSQL transaction + `SELECT ... FOR UPDATE` 鎖定衝突檢查，或加唯一約束以讓資料庫層拒絕重複。
- **Email 無法驗證真實性**：旅客可填假 Email，取消時以 Email 驗證仍可被繞過。  
  → Mitigation：此為 MVP 接受的風險，進階可加 Email 驗證信。
- **Vite dev server 於 production**：本設計使用 Vite dev server，不適合生產環境。  
  → Mitigation：MVP 接受；生產環境可改用 nginx serve build 產物。

## Migration Plan

1. 執行 `docker compose up --build` 啟動所有服務
2. PostgreSQL 初始化時自動執行 `init.sql`（建表 + seed rooms）
3. 前端 Vite dev server 透過 proxy 設定將 `/api` 轉發至 backend

## Open Questions

- Tailwind CSS 或純 CSS？（建議 Tailwind，開發速度快）
- 是否需要 CORS 設定？（Docker 內部通訊不需要，本地開發透過 Vite proxy 解決）
