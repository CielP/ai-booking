## ADDED Requirements

### Requirement: Docker 映像建構與推送腳本
系統 SHALL 提供 `scripts/deploy.sh` 腳本，自動建構前端與後端 Docker 映像、推送至 ECR、並觸發 ECS 服務更新。

#### Scenario: 完整部署流程
- **WHEN** 執行 `./scripts/deploy.sh`
- **THEN** 腳本 SHALL 依序執行：ECR 登入、建構前端映像（使用 Dockerfile.prod）、建構後端映像、推送兩個映像至 ECR、強制更新 ECS 服務

#### Scenario: ECR 登入失敗
- **WHEN** AWS credentials 無效或過期
- **THEN** 腳本 SHALL 在 ECR 登入步驟失敗並顯示錯誤訊息，不繼續後續步驟

#### Scenario: 部署完成確認
- **WHEN** 腳本執行完畢且無錯誤
- **THEN** 腳本 SHALL 輸出 ECS service 更新狀態，並提示使用者可透過 `aws ecs describe-services` 確認部署結果

### Requirement: 資料庫初始化腳本
系統 SHALL 提供 `scripts/init-db.sh` 腳本，在 RDS 實例上執行 `docker/init.sql` 以初始化資料庫 schema 與種子資料。

#### Scenario: 資料庫初始化成功
- **WHEN** RDS 實例已建立且可連線，執行 `./scripts/init-db.sh`
- **THEN** 腳本 SHALL 透過 ECS run-task 或本機 psql 連線執行 init.sql，建立 tables、indexes、seed data

#### Scenario: 資料庫已初始化時重複執行
- **WHEN** 資料庫 tables 已存在，再次執行 `./scripts/init-db.sh`
- **THEN** 因 init.sql 使用 `CREATE TABLE`（非 IF NOT EXISTS），腳本 SHALL 回傳錯誤。使用者需手動決定是否需要重建

### Requirement: 後端健康檢查端點
後端 Express 伺服器 SHALL 提供 `GET /api/health` 端點，回傳伺服器運行狀態，供 ALB 健康檢查使用。

#### Scenario: 健康檢查成功
- **WHEN** ALB 發送 `GET /api/health` 至後端
- **THEN** 後端 SHALL 回傳 HTTP 200，body 為 `{ "status": "ok" }`

#### Scenario: 伺服器異常時健康檢查失敗
- **WHEN** Express 伺服器程序未啟動或崩潰
- **THEN** ALB 健康檢查 SHALL 因連線逾時而判定為 unhealthy
