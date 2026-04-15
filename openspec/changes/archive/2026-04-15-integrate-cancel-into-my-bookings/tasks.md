## 1. 更新 MyBookings.jsx

- [x] 1.1 新增 `cancellingId` state（`string | null`，記錄目前正在取消的訂單 ID）
- [x] 1.2 新增 `cancelError` state（`string`，記錄取消失敗的錯誤訊息）
- [x] 1.3 實作 `handleCancel(id)` async function：呼叫 `window.confirm()` 確認，確認後呼叫 `DELETE /api/bookings/:id`（含 `credentials: 'include'`），成功則用 `setBookings` 即時更新該筆訂單 status 為 `cancelled`，失敗則設定 `cancelError`
- [x] 1.4 在 `handleCancel` 中：API 呼叫前設 `cancellingId = id`，API 呼叫結束後（無論成功失敗）設 `cancellingId = null`
- [x] 1.5 在訂單卡片的 `booking-details` 區塊下方，當 `b.status === 'active'` 時渲染「取消訂單」按鈕（`btn btn-danger`），並在 `cancellingId === b.id` 時設 `disabled`
- [x] 1.6 在清單頂部顯示 `cancelError` 錯誤訊息（`alert alert-error`），並在下次成功取消時清除

## 2. 更新 App.jsx

- [x] 2.1 移除 tabs 陣列中的 `{ id: 'cancel', label: '取消訂單', show: !!user }` 項目
- [x] 2.2 移除 `import CancelBooking from './pages/CancelBooking'`
- [x] 2.3 移除 `activeTab === 'cancel'` 的 render 分支

## 3. 移除 CancelBooking.jsx

- [x] 3.1 刪除 `frontend/src/pages/CancelBooking.jsx` 檔案

## 4. 驗證

- [x] 4.1 啟動服務（`docker compose up --build -d`），以 guest 帳號登入，確認分頁列不再有「取消訂單」
- [x] 4.2 前往「我的訂單」，確認 active 訂單卡片顯示「取消訂單」按鈕，cancelled 訂單不顯示
- [x] 4.3 點擊取消按鈕，確認 confirm 對話框出現；選擇「取消」後訂單狀態不變
- [x] 4.4 點擊取消按鈕並確認，確認訂單狀態即時變更為「已取消」且按鈕消失，無需重新整理頁面
