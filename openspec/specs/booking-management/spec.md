# Booking Management

## Purpose

TBD — defines how the system handles creating, querying, and cancelling guest bookings.

## Requirements

### Requirement: 建立訂單
系統 SHALL 允許旅客填寫姓名、Email、備注、選擇房間與日期後建立訂單，並回傳唯一訂單編號（UUID）。建立前系統 MUST 驗證該房間在指定日期區間仍為可用狀態。

#### Scenario: 成功建立訂單
- **WHEN** 旅客提供有效的姓名、Email、入住日期、退房日期、房間號碼，且該房間在該區間可用
- **THEN** 系統建立訂單，回傳訂單編號（UUID）與完整訂單資訊，HTTP 201

#### Scenario: 房間已被預訂（衝突）
- **WHEN** 旅客選擇的房間在指定日期區間已有 active 訂單
- **THEN** 系統拒絕建立，回傳 409 錯誤，說明該房間於該區間已被預訂

#### Scenario: 必填欄位缺少
- **WHEN** 旅客未提供姓名、Email、入住日期、退房日期或房間號碼其中之一
- **THEN** 系統回傳 400 錯誤，說明缺少的欄位

#### Scenario: Email 格式無效
- **WHEN** 旅客提供格式不正確的 Email
- **THEN** 系統回傳 400 錯誤，說明 Email 格式無效

#### Scenario: 房間編號不存在
- **WHEN** 旅客提供不在 101–105 範圍內的房間號碼
- **THEN** 系統回傳 404 錯誤，說明該房間不存在

### Requirement: 以 Email 查詢訂單
系統 SHALL 允許旅客輸入 Email，取得該 Email 名下所有訂單清單（含 active 與 cancelled）。

#### Scenario: 查詢到訂單
- **WHEN** 旅客輸入有訂單記錄的 Email
- **THEN** 系統回傳該 Email 所有訂單，依入住日期排序，含訂單編號、房間號碼、姓名、日期、狀態

#### Scenario: 無訂單記錄
- **WHEN** 旅客輸入無任何訂單的 Email
- **THEN** 系統回傳空清單

#### Scenario: Email 格式無效
- **WHEN** 旅客提供格式不正確的 Email
- **THEN** 系統回傳 400 錯誤

### Requirement: 取消訂單
系統 SHALL 允許旅客提供訂單編號與 Email 進行驗證後取消訂單。取消後訂單狀態改為 `cancelled`，不可再次取消。

#### Scenario: 成功取消訂單
- **WHEN** 旅客提供有效的訂單編號，且該訂單的 guest_email 與提供的 Email 相符，且訂單狀態為 active
- **THEN** 系統將訂單狀態改為 cancelled，回傳更新後訂單資訊，HTTP 200

#### Scenario: Email 不符合
- **WHEN** 旅客提供的 Email 與訂單的 guest_email 不符
- **THEN** 系統回傳 403 錯誤，說明無權取消此訂單

#### Scenario: 訂單不存在
- **WHEN** 旅客提供的訂單編號不存在於系統中
- **THEN** 系統回傳 404 錯誤，說明訂單不存在

#### Scenario: 訂單已取消
- **WHEN** 旅客嘗試取消一個狀態已為 cancelled 的訂單
- **THEN** 系統回傳 409 錯誤，說明訂單已取消
