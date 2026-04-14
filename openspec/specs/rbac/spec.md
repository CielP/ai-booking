# RBAC

## Purpose

TBD — defines role-based access control rules, including role definitions and access restrictions per role.

## Requirements

### Requirement: 角色定義
系統 SHALL 支援兩種角色：`guest`（一般用戶）與 `admin`（管理者）。所有新註冊帳號預設為 `guest`。`admin` 帳號由系統初始化時 seed，或由現有 admin 將 guest 升級。

#### Scenario: 新註冊帳號預設角色
- **WHEN** 訪客透過公開註冊端點建立帳號
- **THEN** 帳號 role 欄位為 `guest`，不可自行指定 role

#### Scenario: Admin 帳號存在於初始資料庫
- **WHEN** 資料庫首次初始化（docker/init.sql 執行）
- **THEN** 系統內存在至少一個 role 為 `admin` 的帳號，密碼由 ADMIN_PASSWORD 環境變數決定

### Requirement: 匿名訪客存取限制
系統 SHALL 允許未登入訪客存取「查詢可用房間」功能，其他所有功能（預訂、查詢訂單、取消）MUST 拒絕，回傳 401。

#### Scenario: 匿名訪客查詢可用房間
- **WHEN** 未持有 JWT Cookie 的用戶呼叫 GET /api/rooms/available
- **THEN** 系統正常回傳可用房間清單，HTTP 200

#### Scenario: 匿名訪客嘗試預訂
- **WHEN** 未持有 JWT Cookie 的用戶呼叫 POST /api/bookings
- **THEN** 系統回傳 401 錯誤，說明「請先登入」

#### Scenario: 匿名訪客嘗試查詢訂單
- **WHEN** 未持有 JWT Cookie 的用戶呼叫 GET /api/bookings
- **THEN** 系統回傳 401 錯誤

### Requirement: Guest 存取控制
已登入 guest MUST 只能存取自己的訂單資料，不得查看或操作他人訂單。

#### Scenario: Guest 查詢訂單只看到自己的
- **WHEN** guest 呼叫 GET /api/bookings
- **THEN** 系統回傳該 user_id 對應的訂單，不回傳其他用戶的訂單

#### Scenario: Guest 嘗試取消他人訂單
- **WHEN** guest 嘗試呼叫 DELETE /api/bookings/:id，但該訂單的 user_id 不屬於此 guest
- **THEN** 系統回傳 403 錯誤，說明「無權操作此訂單」

### Requirement: Admin 存取控制
Admin MUST 能存取所有用戶的訂單，並執行管理操作（取消任何訂單、管理帳號、管理房間資訊）。非 admin 存取 admin 端點 MUST 回傳 403。

#### Scenario: Admin 查詢所有訂單
- **WHEN** admin 呼叫 GET /api/bookings
- **THEN** 系統回傳全部訂單（不限 user_id），HTTP 200

#### Scenario: Admin 取消他人訂單
- **WHEN** admin 呼叫 DELETE /api/bookings/:id，該訂單屬於任意 guest
- **THEN** 系統成功取消訂單，HTTP 200

#### Scenario: Guest 嘗試存取 Admin 端點
- **WHEN** guest 呼叫任何 /api/admin/* 端點
- **THEN** 系統回傳 403 錯誤，說明「需要管理者權限」
