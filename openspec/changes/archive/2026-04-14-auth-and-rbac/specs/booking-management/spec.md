## MODIFIED Requirements

### Requirement: 建立訂單
系統 SHALL 允許已登入用戶（guest 或 admin）選擇房間與日期後建立訂單，並回傳唯一訂單編號（UUID）。建立前系統 MUST 驗證該房間在指定日期區間仍為可用狀態。訂單 MUST 關聯至登入用戶的 user_id。姓名與 Email 由 JWT 自動帶入，不可由請求 body 覆蓋。

#### Scenario: 成功建立訂單
- **WHEN** 已登入用戶提供有效的入住日期、退房日期、房間號碼，且該房間在該區間可用
- **THEN** 系統建立訂單（guest_name/guest_email 由 JWT 帶入，user_id 關聯至登入用戶），回傳訂單編號（UUID）與完整訂單資訊，HTTP 201

#### Scenario: 未登入嘗試建立訂單
- **WHEN** 未持有有效 JWT Cookie 的用戶呼叫 POST /api/bookings
- **THEN** 系統回傳 401 錯誤，說明「請先登入」

#### Scenario: 房間已被預訂（衝突）
- **WHEN** 已登入用戶選擇的房間在指定日期區間已有 active 訂單
- **THEN** 系統拒絕建立，回傳 409 錯誤，說明該房間於該區間已被預訂

#### Scenario: 必填欄位缺少
- **WHEN** 已登入用戶未提供入住日期、退房日期或房間號碼其中之一
- **THEN** 系統回傳 400 錯誤，說明缺少的欄位

#### Scenario: 房間編號不存在
- **WHEN** 已登入用戶提供不在 101–105 範圍內的房間號碼
- **THEN** 系統回傳 404 錯誤，說明該房間不存在

### Requirement: 查詢自己的訂單
系統 SHALL 允許已登入用戶查詢自己（user_id 對應）的所有訂單（含 active 與 cancelled）。Admin 呼叫相同端點時回傳全部訂單。

#### Scenario: Guest 查詢自己的訂單
- **WHEN** 已登入 guest 呼叫 GET /api/bookings
- **THEN** 系統回傳該 user_id 下所有訂單，依入住日期排序，HTTP 200

#### Scenario: Admin 查詢全部訂單
- **WHEN** 已登入 admin 呼叫 GET /api/bookings
- **THEN** 系統回傳所有用戶的所有訂單，HTTP 200

#### Scenario: 未登入嘗試查詢訂單
- **WHEN** 未持有有效 JWT Cookie 的用戶呼叫 GET /api/bookings
- **THEN** 系統回傳 401 錯誤

### Requirement: 取消訂單
系統 SHALL 允許已登入用戶取消自己名下的訂單（user_id 對應）；admin 可取消任意訂單。取消後訂單狀態改為 `cancelled`，不可再次取消。

#### Scenario: Guest 成功取消自己的訂單
- **WHEN** 已登入 guest 呼叫 DELETE /api/bookings/:id，且該訂單的 user_id 與登入用戶相符，狀態為 active
- **THEN** 系統將訂單狀態改為 cancelled，回傳更新後訂單資訊，HTTP 200

#### Scenario: Admin 成功取消任意訂單
- **WHEN** 已登入 admin 呼叫 DELETE /api/bookings/:id，且訂單狀態為 active
- **THEN** 系統將訂單狀態改為 cancelled，HTTP 200

#### Scenario: Guest 嘗試取消他人訂單
- **WHEN** 已登入 guest 嘗試取消 user_id 不屬於自己的訂單
- **THEN** 系統回傳 403 錯誤，說明「無權取消此訂單」

#### Scenario: 未登入嘗試取消訂單
- **WHEN** 未持有有效 JWT Cookie 的用戶呼叫 DELETE /api/bookings/:id
- **THEN** 系統回傳 401 錯誤

#### Scenario: 訂單不存在
- **WHEN** 用戶提供的訂單編號不存在
- **THEN** 系統回傳 404 錯誤，說明訂單不存在

#### Scenario: 訂單已取消
- **WHEN** 用戶嘗試取消一個狀態已為 cancelled 的訂單
- **THEN** 系統回傳 409 錯誤，說明訂單已取消

## REMOVED Requirements

### Requirement: 以 Email 查詢訂單
**Reason**: 改為基於 JWT 身份驗證的查詢方式，無需再輸入 Email。Email-only 查詢無法驗證身份，存在安全疑慮。
**Migration**: 前端「我的訂單」頁面改為直接呼叫 GET /api/bookings（帶 JWT Cookie），後端依 role 決定回傳範圍。
