# Room Availability

## Purpose

TBD — defines how the system exposes available rooms for a given date range.

## Requirements

### Requirement: 查詢指定日期區間的可用房間
系統 SHALL 依旅客提供的入住日期（check_in）與退房日期（check_out）回傳目前可預訂的房間清單（101–105）。若某房間在該區間內已有 active 訂單（日期重疊），則該房間不得出現在可用清單中。

#### Scenario: 所有房間皆可用
- **WHEN** 旅客查詢一段無任何訂單的日期區間
- **THEN** 系統回傳全部 5 間房間（101、102、103、104、105）

#### Scenario: 部分房間已被預訂
- **WHEN** 旅客查詢某日期區間，且其中 101 號房在該區間有 active 訂單
- **THEN** 系統回傳 102、103、104、105，不含 101

#### Scenario: 所有房間皆已被預訂
- **WHEN** 旅客查詢某日期區間，且 5 間房皆有 active 訂單
- **THEN** 系統回傳空清單，並顯示「該日期區間已無空房」

#### Scenario: 日期區間不合法
- **WHEN** 旅客提供的退房日期早於或等於入住日期
- **THEN** 系統回傳 400 錯誤，說明日期區間無效

#### Scenario: 缺少查詢參數
- **WHEN** 旅客未提供 check_in 或 check_out
- **THEN** 系統回傳 400 錯誤，說明必填參數缺少
