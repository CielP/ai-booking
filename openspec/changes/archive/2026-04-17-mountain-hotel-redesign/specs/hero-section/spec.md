## ADDED Requirements

### Requirement: Hero 漸層橫幅
「查詢空房」頁面 SHALL 在搜尋表單上方顯示全寬的 Hero 區塊，使用 CSS 多層漸層模擬山景剪影（深藍天空 → 墨綠山巒 → 金色地平線光暈），疊加品牌名「山景旅宿」與標語。

#### Scenario: Hero 區塊正常顯示
- **WHEN** 用戶進入「查詢空房」頁面
- **THEN** 頁面頂部顯示 Hero 區塊，高度桌面版約 280px、手機版約 180px，內含「山景旅宿」標題（Noto Serif TC, 金色文字）與副標語「寧靜山林間的舒適住所」

#### Scenario: Hero 深色模式
- **WHEN** 深色模式啟用時
- **THEN** Hero 漸層色彩 SHALL 加深，文字保持金色高對比，整體色調和諧

#### Scenario: Hero 響應式縮放
- **WHEN** 螢幕寬度 < 768px
- **THEN** Hero 高度縮小、標題字級縮小，保持可讀性與視覺平衡

#### Scenario: prefers-reduced-motion
- **WHEN** 用戶系統設定偏好減少動態效果
- **THEN** Hero 區塊 SHALL 不播放任何動畫，靜態顯示即可
