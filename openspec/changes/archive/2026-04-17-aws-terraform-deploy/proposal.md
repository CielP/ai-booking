## Why

目前系統僅透過 Docker Compose 在本機開發環境運行，無法對外提供服務。需要將網站部署至 AWS 生產環境，讓真實用戶可以透過 `https://wsterling.org/mountain-lodge/` 存取旅館訂房系統。選擇子路徑（subpath）部署是為了保留域名根路徑給未來其他專案使用。

## What Changes

- 新增 Terraform 基礎設施即代碼（IaC），包含完整 AWS 資源定義（VPC、ECS Fargate、RDS、ALB、ACM、Secrets Manager、ECR、CloudWatch）
- 新增前端生產環境 Dockerfile（多階段建構：Vite build → Nginx 靜態服務）
- 新增 Nginx 設定檔，處理子路徑 `/mountain-lodge/` 的靜態檔案服務與 API 反向代理
- 修改前端所有 fetch 呼叫，支援可配置的 API 基礎路徑（透過環境變數 `VITE_API_BASE`）
- 修改 Vite 設定檔，支援生產環境的 `base` 路徑
- 修改後端 Express 入口，新增 `/api/health` 健康檢查端點，並調整 CORS 設定
- 新增部署腳本（build、push ECR、更新 ECS service）
- 新增資料庫初始化腳本（透過 ECS 執行 init.sql）

## Capabilities

### New Capabilities
- `aws-infrastructure`: Terraform 定義的 AWS 基礎設施（VPC、ECS Fargate、RDS PostgreSQL 16 + pgvector、ALB + HTTPS、ACM 憑證、Secrets Manager、ECR、CloudWatch），部署於 ap-northeast-1（東京）
- `subpath-deployment`: 支援子路徑 `/mountain-lodge/` 部署，包含 Nginx 反向代理設定、前端 base path 配置、API 路徑轉發，保留域名根路徑供未來其他專案使用
- `deployment-scripts`: 自動化部署腳本（Docker image 建構與推送至 ECR、ECS 服務更新、資料庫初始化）

### Modified Capabilities
- `frontend-layout`: 前端所有 fetch URL 需支援可配置的 API 基礎路徑前綴（`VITE_API_BASE` 環境變數），Vite 建構需支援 `base` 路徑配置

## Impact

- **新增檔案**：`terraform/` 目錄（約 12 個 .tf 檔案）、`frontend/nginx.conf`、`frontend/Dockerfile.prod`、`frontend/src/config.js`、`scripts/deploy.sh`、`scripts/init-db.sh`
- **修改檔案**：`frontend/src/` 下 9 個含 fetch 呼叫的檔案（加入 API_BASE 前綴）、`frontend/vite.config.js`、`backend/src/index.js`
- **外部依賴**：AWS 帳號、Terraform CLI、AWS CLI、Docker（建構推送映像）
- **DNS**：需在外部 DNS 供應商手動新增 CNAME 記錄（ACM 驗證 + 指向 ALB）
- **費用**：估計每月約 $54 USD（ECS Fargate + ALB + RDS db.t3.micro + Secrets Manager + ECR/CloudWatch）
- **本機開發不受影響**：`VITE_API_BASE` 預設為空字串，Docker Compose 開發流程維持不變
