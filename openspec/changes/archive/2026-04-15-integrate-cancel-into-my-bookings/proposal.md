## Why

「取消訂單」目前是獨立分頁，使用者需手動輸入訂單 UUID 才能取消，操作繁瑣且易出錯。將取消功能整合至「我的訂單」頁面，讓使用者可直接在訂單清單中點擊取消，大幅提升使用體驗。

## What Changes

- **「我的訂單」頁面**新增每張有效訂單（`status=active`）的「取消訂單」按鈕
- 點擊取消按鈕後彈出確認對話框，確認後呼叫 `DELETE /api/bookings/:id`
- 取消成功後即時更新該筆訂單狀態（`status` 改為 `cancelled`），隱藏取消按鈕
- **移除「取消訂單」獨立分頁**（包含 `CancelBooking.jsx` 元件及 App.jsx 中的 tab 設定）

## Capabilities

### New Capabilities

- `inline-cancel-booking`：在「我的訂單」清單中直接取消訂單的功能，包含確認對話框與即時狀態更新

### Modified Capabilities

- `booking-management`：取消訂單的操作入口從獨立分頁改為整合於訂單清單內

## Impact

- `frontend/src/pages/MyBookings.jsx`：新增取消邏輯與 UI
- `frontend/src/App.jsx`：移除 `cancel` tab 與 `CancelBooking` import
- `frontend/src/pages/CancelBooking.jsx`：移除（功能已整合）
- 後端 API 無需變更（`DELETE /api/bookings/:id` 已存在）
