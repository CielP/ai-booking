## Why

目前旅館缺乏線上預訂系統，旅客需電話或現場預訂，無法即時查詢空房。透過建立一個簡易的網頁訂房系統，旅客可自助查詢、預訂、取消，提升服務效率。

## What Changes

- 新增旅館房間預訂網站（前端 React + 後端 Express + PostgreSQL）
- 旅客無需帳號，填寫姓名、Email、備注即可完成預訂
- 系統管理 5 間房間（101–105），同一房型
- 提供查詢空房、建立訂單、查詢訂單、取消訂單功能
- 以 Docker Compose 部署，含 pgAdmin 管理介面

## Capabilities

### New Capabilities

- `room-availability`: 依入住/退房日期查詢可用房間（101–105）
- `booking-management`: 建立訂單（含訂單編號回傳）、以 Email 查詢訂單、以訂單編號取消訂單

### Modified Capabilities

（無現有 spec 需修改）

## Impact

- **新建系統**：無現有程式碼，全新開發
- **資料庫**：PostgreSQL，含 `rooms` 與 `bookings` 資料表
- **API**：RESTful JSON API（Express）
- **前端**：React（Vite）單頁應用，繁體中文介面
- **部署**：Docker Compose（db、pgadmin、api、web 四個服務）
- **依賴**：Node.js、PostgreSQL 16、pgAdmin 4
