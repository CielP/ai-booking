## Why

目前登入與註冊功能以 tab 頁籤形式呈現，與查詢空房等核心功能並排，視覺層級混亂，不符合一般 Web 應用慣例。將兩者移至 header 右上角，可讓 tab 列聚焦於業務功能，auth 動作回歸慣用位置。

## What Changes

- 移除 tab 列中的「登入」與「註冊」兩個頁籤
- header 右上角新增條件渲染：
  - 未登入時：顯示「登入」與「註冊」按鈕，點擊後展開對應完整頁面
  - 已登入時：維持現有用戶資訊顯示（姓名、角色標籤、登出按鈕）
- 新增 header auth 按鈕的 CSS 樣式

## Capabilities

### New Capabilities

無新能力（登入/註冊功能本身不變，僅調整入口位置）

### Modified Capabilities

- `user-auth`：登入與註冊的 UI 入口從 tab 列移至 header 右上角按鈕

## Impact

- `frontend/src/App.jsx`：修改 tabs 陣列與 header 區塊
- `frontend/src/index.css`：新增 header auth 按鈕樣式
- 後端、API、資料庫不受影響
