## 1. 修改 App.jsx — 移除 tab 入口

- [x] 1.1 移除 tabs 陣列中的 `login` 與 `register` 項目
- [x] 1.2 確認 `activeTab` 初始值與切換邏輯不受影響（login/register 頁面仍可由 setActiveTab 展開）

## 2. 修改 App.jsx — 新增 Header Auth 按鈕

- [x] 2.1 在 `.app-header` 右側加入條件渲染：`!user` 時顯示「登入」與「註冊」兩個按鈕
- [x] 2.2 按鈕點擊時呼叫 `setActiveTab('login')` / `setActiveTab('register')`
- [x] 2.3 確認已登入時 header 右側顯示現有的 `.user-info` 區塊（姓名、角色標籤、登出按鈕），不顯示 auth 按鈕

## 3. 修改 index.css — Header Auth 按鈕樣式

- [x] 3.1 新增 `.btn-auth-outline` 樣式：白底、藍色邊框與文字，hover 時藍底白字（用於「登入」按鈕）
- [x] 3.2 確認「註冊」按鈕套用現有 `.btn-primary` 樣式，無需新增

## 4. 驗證

- [x] 4.1 未登入時：確認 tab 列無「登入」「註冊」頁籤，header 右上角顯示兩個按鈕
- [x] 4.2 點擊「登入」→ 展開登入表單；填寫正確帳密 → 登入成功，header 切換為用戶資訊
- [x] 4.3 點擊「登出」→ header 恢復顯示「登入」「註冊」按鈕
- [x] 4.4 點擊「註冊」→ 展開註冊表單；填寫資料 → 註冊並自動登入，header 切換為用戶資訊

<!-- 驗證任務需在瀏覽器中手動測試 -->
