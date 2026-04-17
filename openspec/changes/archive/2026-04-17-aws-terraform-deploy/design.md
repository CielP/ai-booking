## Context

目前「山景旅宿」透過 Docker Compose 在本機運行四個服務（db、pgadmin、api、web），無法對外提供服務。前端使用 Vite 開發伺服器（`npm run dev`），透過 proxy 轉發 `/api/*` 至後端。所有 fetch 呼叫使用硬編碼的相對路徑（如 `/api/auth/me`），不支援子路徑部署。

目標是部署至 AWS 東京（ap-northeast-1），使用 `https://wsterling.org/mountain-lodge/` 子路徑服務網站，域名 DNS 由外部供應商管理（非 Route 53）。

## Goals / Non-Goals

**Goals:**
- 透過 Terraform IaC 定義完整 AWS 基礎設施，可重複建立/銷毀
- 使用 ECS Fargate 全託管容器服務，免維護 EC2
- 使用 RDS PostgreSQL 16（支援 pgvector）作為託管資料庫
- 透過 ALB + ACM 提供 HTTPS 加密連線
- 使用 Secrets Manager 安全管理敏感設定（API keys、JWT secret、DB 密碼）
- 支援 `/mountain-lodge/` 子路徑部署，保留域名根路徑供未來其他專案
- 本機開發流程（Docker Compose）維持不變

**Non-Goals:**
- CI/CD 自動化管線（本次使用手動部署腳本）
- RDS Multi-AZ 高可用（成本考量，未來可升級）
- Auto-scaling（目前為低流量場景，固定 1 個 task）
- CloudFront CDN（未來可加入）
- pgAdmin 部署（透過 SSH tunnel 或 ECS Exec 管理 DB）
- 域名遷移至 Route 53（維持外部 DNS 供應商）

## Decisions

### 1. ECS Fargate Sidecar 模式（Nginx + Node.js 同一 Task）

**選擇**：將 Nginx 與 Node.js 放在同一個 ECS Task Definition 的兩個 container 中。

**替代方案**：
- 兩個獨立 ECS Service + Service Discovery → 需要 Cloud Map，增加複雜度與成本
- 單一 container 內跑 Nginx + Node.js → 違反容器單一職責原則

**理由**：Sidecar 模式讓 Nginx 透過 `localhost:3000` 直接連接 Node.js，無需服務發現。ECS task 內的 container 共享 network namespace，通訊零延遲。部署時兩者一起更新，版本一致性有保障。

### 2. Nginx 處理子路徑剝離

**選擇**：由 Nginx 負責將 `/mountain-lodge/api/*` 轉發為 `/api/*` 至 Node.js，並將 `/mountain-lodge/*` 的靜態檔案請求對應到 Vite build output。

**理由**：後端 Express 路由完全不需修改（維持 `/api/*`），前端 build 時設定 `base: '/mountain-lodge/'` 即可。Nginx 作為反向代理同時處理靜態檔案服務與 API 轉發，是最標準的做法。

### 3. ECS 部署於公有子網（Public Subnet + 公有 IP）

**選擇**：ECS Fargate task 部署於公有子網，分配公有 IP 以便拉取 ECR 映像與存取外部 API。

**替代方案**：
- 私有子網 + NAT Gateway → 每月增加約 $45 USD
- 私有子網 + VPC Endpoint → 需要多個 endpoint（ECR、S3、CloudWatch、Secrets Manager），成本亦高

**理由**：安全性透過 Security Group 控制（僅允許 ALB 流量進入 ECS），成本大幅降低。對於低流量網站，此架構已足夠安全。

### 4. RDS 部署於私有子網

**選擇**：RDS 實例放置於私有子網，僅允許 ECS Security Group 的流量進入。

**理由**：資料庫不需要對外存取，私有子網 + Security Group 雙重保護。管理時透過 ECS Exec 或 SSH tunnel 連線。

### 5. ACM 憑證 DNS 驗證

**選擇**：使用 ACM 免費 SSL 憑證，搭配 DNS CNAME 記錄驗證。

**理由**：ACM 與 ALB 整合零成本，Terraform 會輸出需要在外部 DNS 供應商手動新增的 CNAME 記錄。驗證通過後自動續約。

### 6. 前端 API_BASE 環境變數

**選擇**：新增 `frontend/src/config.js` 導出 `API_BASE`（讀取 `import.meta.env.VITE_API_BASE`，預設空字串），所有 fetch 呼叫加上此前綴。

**替代方案**：
- 前端直接使用相對路徑，由 Nginx rewrite 處理 → 可行但 SSE streaming 較難處理
- 使用 React Router basename → 目前無使用 React Router

**理由**：最小侵入性修改。開發環境 `VITE_API_BASE=''`（Vite proxy 處理），生產環境 `VITE_API_BASE='/mountain-lodge'`。前端程式碼改動明確且可測試。

### 7. Terraform State 存放於 S3 + DynamoDB

**選擇**：建立獨立的 `terraform/state/` 模組，管理 S3 bucket（存放 state 檔案）+ DynamoDB table（state lock）。

**理由**：團隊協作與狀態安全的最佳實踐。獨立模組避免雞生蛋問題（state backend 自身用 local state）。

### 8. Secrets Manager 管理敏感設定

**選擇**：JWT_SECRET、ANTHROPIC_API_KEY、OPENAI_API_KEY、DB_PASSWORD、ADMIN_PASSWORD 存放於 AWS Secrets Manager，ECS Task Role 授權讀取。

**理由**：避免敏感資訊出現在 Terraform state 明文或環境變數中。ECS 原生支援從 Secrets Manager 注入環境變數（`valueFrom`）。

## 受影響的 API 端點

### 新增端點
- `GET /api/health` — ALB 健康檢查端點，回傳 `{ status: 'ok' }`

### 修改行為
- 所有端點：CORS `origin` 設定在生產環境限制為 `https://wsterling.org`（透過 `CORS_ORIGIN` 環境變數控制）
- Cookie 設定：`secure: true` 在生產環境自動啟用（已有 `process.env.NODE_ENV === 'production'` 判斷）

### DB Schema 變更
- 無 schema 變更。使用與本機相同的 `docker/init.sql` 初始化 RDS。

## Risks / Trade-offs

| 風險 | 緩解措施 |
|------|----------|
| ECS 在公有子網暴露面較大 | Security Group 僅允許 ALB 流量（port 80）進入 ECS；Node.js 不對外暴露 |
| RDS 單一 AZ 無高可用 | 低流量場景可接受；未來可升級 Multi-AZ（約 $38/月） |
| ACM DNS 驗證需手動操作 | Terraform 輸出明確的 CNAME 記錄，使用者依指示在 DNS 供應商設定即可 |
| 無 CI/CD，部署依賴手動腳本 | deploy.sh 腳本標準化流程；未來可整合 GitHub Actions |
| pgvector 在 RDS 上的相容性 | Amazon RDS PostgreSQL 16 原生支援 pgvector 擴充套件 |
| Terraform state backend 為獨立模組 | 首次需手動 `terraform apply` state 模組；之後自動管理 |
| 外部 DNS 供應商需手動設定記錄 | 部署完成後輸出所有需要的 DNS 記錄，附操作說明 |

## Migration Plan

1. **Phase 1**：在 `terraform/state/` 執行 `terraform apply`，建立 state backend
2. **Phase 2**：修改應用程式碼（API_BASE、health endpoint、CORS、Dockerfile.prod、nginx.conf）
3. **Phase 3**：在 `terraform/` 執行 `terraform apply`，建立所有 AWS 資源
4. **Phase 4**：使用者在外部 DNS 供應商新增 ACM CNAME 驗證記錄，等待驗證通過
5. **Phase 5**：執行 `scripts/deploy.sh`，建構映像並推送至 ECR，啟動 ECS 服務
6. **Phase 6**：執行 `scripts/init-db.sh`，初始化 RDS 資料庫
7. **Phase 7**：使用者在 DNS 供應商新增 CNAME 記錄指向 ALB DNS name
8. **Rollback**：`terraform destroy` 可完整移除所有 AWS 資源；本機 Docker Compose 環境不受影響

## Open Questions

- 無（所有決策已在討論階段確認）
