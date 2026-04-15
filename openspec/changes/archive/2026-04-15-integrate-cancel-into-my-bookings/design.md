## Context

目前系統中「取消訂單」為獨立分頁（`CancelBooking.jsx`），操作流程為：使用者需手動輸入訂單 UUID → 送出 `DELETE /api/bookings/:id`。此設計與「我的訂單」（`MyBookings.jsx`）完全分離，使用者無法直接在訂單清單中操作。

後端 `DELETE /api/bookings/:id` 端點已完善，支援 guest 只能取消自己的訂單、admin 無限制，所有授權邏輯均在後端完成。本次變更**僅涉及前端**，無需修改後端。

## Goals / Non-Goals

**Goals:**
- 在 `MyBookings.jsx` 的每張 `status=active` 訂單卡片上新增「取消訂單」按鈕
- 點擊後以 `window.confirm()` 進行二次確認
- 確認後呼叫 `DELETE /api/bookings/:id`，成功則即時更新 state（不重新 fetch）
- 移除 `cancel` tab 及 `CancelBooking.jsx`

**Non-Goals:**
- 後端 API 修改（`DELETE /api/bookings/:id` 已足夠）
- 自訂 Modal UI（使用原生 `window.confirm()` 即可）
- Admin 後台的取消操作（已有獨立管理介面）
- 錯誤重試機制

## Decisions

**決策 1：使用 `window.confirm()` 而非自訂 Modal**

原生 `confirm` 對話框實作成本低，且與現有元件不需額外狀態管理。本專案無 UI 框架，建立 Modal 需額外 CSS 與 state，超出本次變更範疇。

**決策 2：即時更新 state（樂觀更新）而非重新 fetch**

取消訂單是單一確定性操作（成功即代表後端已更新），直接在前端 `map` 更新 `status` 即可，減少不必要的網路請求。若 API 回傳錯誤，則顯示錯誤訊息、不更新 state。

**決策 3：取消中禁用按鈕（loading state per booking）**

為防止重複點擊，每筆訂單維護獨立的 `cancellingId` state，取消進行中時禁用對應按鈕。使用單一 `cancellingId`（string | null）取代 Map，因同時只會取消一筆。

**決策 4：移除 `CancelBooking.jsx` 檔案**

原元件功能完整整合至 `MyBookings.jsx`，保留只會造成死碼，直接刪除。

## Risks / Trade-offs

- **`window.confirm()` 在部分環境被攔截** → 影響範圍小（旅館內網環境），且現有代碼無此考量，接受此風險
- **樂觀更新與後端不一致** → 僅在 API 成功後更新，非樂觀更新，不存在此問題
- **移除獨立取消頁面後，bookmark 舊 URL 的使用者無法使用** → tab 導覽不維護 URL，此場景不存在
