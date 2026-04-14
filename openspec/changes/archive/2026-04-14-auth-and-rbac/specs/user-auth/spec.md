## ADDED Requirements

### Requirement: 使用者註冊
系統 SHALL 允許訪客透過提供姓名、Email 與密碼自行建立 guest 帳號。Email 在系統中 MUST 唯一。密碼 MUST 以 bcrypt hash 後儲存，絕不明文存入資料庫。

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

### Requirement: 使用者登入
系統 SHALL 允許已註冊用戶以 Email 與密碼登入，成功後以 httpOnly Cookie 回傳 JWT token。

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

### Requirement: 使用者登出
系統 SHALL 提供登出端點，清除 JWT Cookie，使 token 立即失效（用戶端角度）。

#### Scenario: 成功登出
- **WHEN** 已登入用戶呼叫登出端點
- **THEN** 系統清除 JWT Cookie（設 maxAge=0），回傳成功訊息，HTTP 200

#### Scenario: 未登入時登出
- **WHEN** 未持有 JWT Cookie 的用戶呼叫登出端點
- **THEN** 系統仍回傳 200（冪等行為，不報錯）

### Requirement: 取得目前登入用戶資訊
系統 SHALL 提供端點讓前端初始化時確認登入狀態，回傳目前 JWT 對應的用戶基本資料。

#### Scenario: Cookie 有效
- **WHEN** 用戶持有有效 JWT Cookie 呼叫 GET /api/auth/me
- **THEN** 系統回傳 { id, name, email, role }，HTTP 200

#### Scenario: Cookie 無效或未提供
- **WHEN** 用戶未持有 Cookie 或 Cookie 已過期
- **THEN** 系統回傳 401 錯誤，前端清除本地登入狀態
