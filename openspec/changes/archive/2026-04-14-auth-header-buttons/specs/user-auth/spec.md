## MODIFIED Requirements

### Requirement: 使用者登入
系統 SHALL 允許已註冊用戶以 Email 與密碼登入，成功後以 httpOnly Cookie 回傳 JWT token。登入入口 SHALL 位於應用程式 header 右上角，而非 tab 導覽列。

#### Scenario: 成功登入
- **WHEN** 用戶提供正確的 Email 與密碼，且帳號為 active 狀態
- **THEN** 系統驗證通過，在回應中設定 httpOnly JWT Cookie，回傳使用者基本資料（id、name、email、role），HTTP 200

#### Scenario: 密碼錯誤
- **WHEN** 用戶提供正確的 Email 但密碼不符
- **THEN** 系統回傳 401 錯誤，說明「Email 或密碼不正確」（不揭露哪個欄位錯誤）

#### Scenario: Email 不存在
- **WHEN** 用戶提供系統中不存在的 Email
- **THEN** 系統回傳 401 錯誤，說明「Email 或密碼不正確」

#### Scenario: 帳號已停用
- **WHEN** 用戶的帳號 is_active 為 false
- **THEN** 系統回傳 403 錯誤，說明「此帳號已被停用」

### Requirement: 使用者註冊
系統 SHALL 允許訪客透過提供姓名、Email 與密碼自行建立 guest 帳號。Email 在系統中 MUST 唯一。密碼 MUST 以 bcrypt hash 後儲存，絕不明文存入資料庫。註冊入口 SHALL 位於應用程式 header 右上角，而非 tab 導覽列。

#### Scenario: 成功註冊
- **WHEN** 訪客提供未使用的 Email、有效姓名與符合長度要求的密碼（≥8 字元）
- **THEN** 系統建立 guest 帳號，自動登入並在回應 Cookie 中設定 JWT（httpOnly），回傳使用者基本資料（id、name、email、role），HTTP 201

#### Scenario: Email 已被使用
- **WHEN** 訪客提供的 Email 已存在於系統中
- **THEN** 系統回傳 409 錯誤，說明「此 Email 已被註冊」

#### Scenario: 密碼過短
- **WHEN** 訪客提供少於 8 字元的密碼
- **THEN** 系統回傳 400 錯誤，說明「密碼至少需要 8 個字元」

#### Scenario: 必填欄位缺少
- **WHEN** 訪客未提供姓名、Email 或密碼其中之一
- **THEN** 系統回傳 400 錯誤，說明缺少的欄位

## ADDED Requirements

### Requirement: Header Auth 入口
未登入時，應用程式 header 右上角 SHALL 顯示「登入」與「註冊」兩個按鈕；已登入時，該區域 SHALL 顯示用戶姓名、角色標籤與「登出」按鈕，不得同時顯示登入/註冊按鈕。

#### Scenario: 未登入時顯示 Auth 按鈕
- **WHEN** 使用者尚未登入，進入任何頁面
- **THEN** header 右上角顯示「登入」與「註冊」兩個按鈕，tab 列中不顯示登入/註冊頁籤

#### Scenario: 點擊登入按鈕展開登入頁面
- **WHEN** 未登入使用者點擊 header 右上角「登入」按鈕
- **THEN** 主內容區展開登入表單頁面

#### Scenario: 點擊註冊按鈕展開註冊頁面
- **WHEN** 未登入使用者點擊 header 右上角「註冊」按鈕
- **THEN** 主內容區展開註冊表單頁面

#### Scenario: 已登入時不顯示 Auth 按鈕
- **WHEN** 使用者已登入
- **THEN** header 右上角顯示用戶姓名、角色標籤（admin 時）及「登出」按鈕，不顯示「登入」與「註冊」按鈕
