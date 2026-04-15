# Admin Dashboard — Delta Spec

## MODIFIED Requirements

### Requirement: 管理者後台分頁結構
系統 SHALL 在管理後台提供四個 sub-tab：「訂單管理」、「帳號管理」、「房間管理」、「知識庫管理」。新增的「知識庫管理」分頁提供知識庫 chunks 的 CRUD 操作、Markdown 匯入、以及 embedding 重建功能。

#### Scenario: Admin 查看所有訂單
- **WHEN** admin 開啟管理後台的「訂單管理」分頁
- **THEN** 系統顯示所有訂單清單，包含訂單編號、房間號碼、旅客姓名、Email、入住/退房日期、狀態

#### Scenario: Admin 開啟知識庫管理分頁
- **WHEN** admin 點擊管理後台的「知識庫管理」分頁
- **THEN** 系統載入並顯示所有知識庫 chunks 列表，支援新增、編輯、刪除、匯入 Markdown 及重新產生 Embedding 操作
