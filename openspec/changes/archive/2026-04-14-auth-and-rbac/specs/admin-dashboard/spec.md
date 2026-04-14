## ADDED Requirements

### Requirement: 管理者查看所有訂單
系統 SHALL 提供管理者後台頁面，列出所有訂單（不限用戶），並可依狀態篩選，以及取消任意訂單。

#### Scenario: Admin 查看所有訂單
- **WHEN** admin 開啟管理後台的「訂單管理」分頁
- **THEN** 系統顯示所有訂單清單，包含訂單編號、房間號碼、旅客姓名、Email、入住/退房日期、狀態

#### Scenario: Admin 取消任意訂單
- **WHEN** admin 點擊特定訂單的「取消」按鈕並確認
- **THEN** 系統將該訂單狀態改為 cancelled，清單即時更新

#### Scenario: 訂單已為取消狀態
- **WHEN** admin 嘗試取消已為 cancelled 的訂單
- **THEN** 系統回傳 409 錯誤，說明「訂單已取消」

### Requirement: 管理者帳號管理
系統 SHALL 提供管理者後台頁面，列出所有用戶帳號，並可修改角色、停用或重新啟用帳號。

#### Scenario: Admin 查看所有帳號
- **WHEN** admin 開啟「帳號管理」分頁
- **THEN** 系統列出所有用戶（id、姓名、email、role、is_active、建立時間）

#### Scenario: Admin 將 guest 升級為 admin
- **WHEN** admin 修改某 guest 帳號的 role 為 admin
- **THEN** 系統更新該帳號 role，該用戶下次登入後即具有 admin 權限

#### Scenario: Admin 停用帳號
- **WHEN** admin 將某帳號 is_active 設為 false
- **THEN** 系統更新帳號狀態，該用戶後續登入時回傳 403 錯誤

#### Scenario: Admin 嘗試停用自己的帳號
- **WHEN** admin 嘗試停用與當前登入帳號相同的帳號
- **THEN** 系統回傳 400 錯誤，說明「無法停用自己的帳號」

### Requirement: 管理者房間資訊管理
系統 SHALL 提供管理者後台頁面，列出所有房間並可修改房間描述。

#### Scenario: Admin 查看所有房間
- **WHEN** admin 開啟「房間管理」分頁
- **THEN** 系統列出所有房間（101–105）及其描述

#### Scenario: Admin 更新房間描述
- **WHEN** admin 修改某房間的描述並儲存
- **THEN** 系統更新 rooms 資料表，查詢可用房間時回傳新描述

#### Scenario: 房間不存在
- **WHEN** admin 嘗試更新不存在的房間號碼
- **THEN** 系統回傳 404 錯誤，說明「房間不存在」
