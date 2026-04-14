# Room Booking

## Purpose

TBD — defines the booking form experience for authenticated users, including auto-fill of user data from JWT.

## Requirements

### Requirement: 登入後訂房表單自動帶入用戶資料
系統 SHALL 在已登入用戶進入訂房頁面時，自動將 JWT 中的姓名（name）與 Email 填入表單對應欄位，且該欄位設為唯讀，不可手動修改。

#### Scenario: 已登入用戶開啟訂房表單
- **WHEN** 已登入用戶切換至「預訂房間」分頁
- **THEN** 姓名與 Email 欄位自動帶入 AuthContext 中的 user.name 與 user.email，欄位顯示為唯讀

#### Scenario: 未登入用戶嘗試開啟訂房分頁
- **WHEN** 未登入用戶嘗試切換至「預訂房間」分頁（或直接存取）
- **THEN** 系統不顯示訂房 tab，或導向登入頁面，提示「請先登入以預訂房間」
