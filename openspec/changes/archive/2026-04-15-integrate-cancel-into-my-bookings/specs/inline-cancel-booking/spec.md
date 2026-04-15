## ADDED Requirements

### Requirement: 在訂單清單中顯示取消按鈕
系統 SHALL 在「我的訂單」頁面的每張 `status=active` 訂單卡片上顯示「取消訂單」按鈕。`status=cancelled` 的訂單 MUST NOT 顯示取消按鈕。

#### Scenario: 有效訂單顯示取消按鈕
- **WHEN** 已登入用戶前往「我的訂單」頁面，且清單中有 `status=active` 的訂單
- **THEN** 每張 active 訂單卡片右下角顯示「取消訂單」按鈕

#### Scenario: 已取消訂單不顯示取消按鈕
- **WHEN** 已登入用戶前往「我的訂單」頁面，且清單中有 `status=cancelled` 的訂單
- **THEN** 該訂單卡片不顯示「取消訂單」按鈕

### Requirement: 取消前顯示確認對話框
系統 SHALL 在用戶點擊「取消訂單」按鈕後顯示確認對話框，確認後才執行取消操作。用戶取消確認時 MUST 不執行任何 API 呼叫。

#### Scenario: 用戶確認取消
- **WHEN** 用戶點擊「取消訂單」按鈕並在確認對話框中選擇「確定」
- **THEN** 系統呼叫 `DELETE /api/bookings/:id` 執行取消

#### Scenario: 用戶放棄取消
- **WHEN** 用戶點擊「取消訂單」按鈕但在確認對話框中選擇「取消」
- **THEN** 系統不執行任何操作，訂單狀態維持 active

### Requirement: 取消成功後即時更新訂單狀態
系統 SHALL 在取消成功後即時將該訂單的狀態更新為 `cancelled`，隱藏取消按鈕，無需重新載入頁面或重新向後端 fetch 訂單清單。

#### Scenario: 成功取消後即時更新
- **WHEN** 取消 API 呼叫回傳成功（HTTP 200）
- **THEN** 該訂單卡片的狀態標籤由「有效」變為「已取消」，取消按鈕消失

#### Scenario: 取消 API 失敗時顯示錯誤
- **WHEN** 取消 API 呼叫回傳錯誤（如 403、404、409）
- **THEN** 頁面顯示繁體中文錯誤訊息，訂單狀態不變，取消按鈕仍可見

### Requirement: 取消進行中禁用按鈕
系統 SHALL 在取消 API 呼叫進行中禁用該訂單的取消按鈕，防止重複點擊。

#### Scenario: 取消進行中按鈕被禁用
- **WHEN** 用戶已確認取消且 API 呼叫尚未完成
- **THEN** 該訂單的「取消訂單」按鈕處於 disabled 狀態

#### Scenario: 取消完成後按鈕狀態恢復（失敗情況）
- **WHEN** 取消 API 呼叫失敗
- **THEN** 按鈕 disabled 狀態解除，用戶可再次嘗試
