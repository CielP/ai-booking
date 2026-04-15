## MODIFIED Requirements

### Requirement: 取消訂單
系統 SHALL 允許已登入用戶透過「我的訂單」頁面的訂單卡片取消自己名下的訂單（user_id 對應）；admin 可取消任意訂單。取消後訂單狀態改為 `cancelled`，不可再次取消。取消入口 MUST 整合於訂單清單中，不提供獨立的「取消訂單」分頁。

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

### Requirement: 獨立「取消訂單」分頁
**Reason**: 取消功能已整合至「我的訂單」頁面的訂單卡片中，獨立分頁造成操作流程割裂且需手動輸入 UUID。
**Migration**: 使用者改由「我的訂單」分頁的訂單卡片上的「取消訂單」按鈕執行取消操作。
