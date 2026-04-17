## ADDED Requirements

### Requirement: VPC 網路架構
系統 SHALL 在 ap-northeast-1（東京）建立一個 VPC，包含 2 個公有子網與 2 個私有子網（分布於 2 個可用區域），搭配 Internet Gateway 與路由表。

#### Scenario: VPC 與子網建立成功
- **WHEN** 執行 `terraform apply`
- **THEN** 建立 VPC（CIDR 10.0.0.0/16）、2 個公有子網（10.0.1.0/24、10.0.2.0/24）、2 個私有子網（10.0.3.0/24、10.0.4.0/24）、Internet Gateway、公有路由表

#### Scenario: 子網分布於不同可用區域
- **WHEN** VPC 建立完成
- **THEN** 公有子網與私有子網 SHALL 各自分布於 ap-northeast-1a 和 ap-northeast-1c 兩個 AZ

### Requirement: Security Groups
系統 SHALL 建立三組 Security Group：ALB（允許 80/443 入站）、ECS（僅允許 ALB SG 流量入站）、RDS（僅允許 ECS SG 流量入站 port 5432）。

#### Scenario: ALB Security Group 規則
- **WHEN** 外部流量嘗試存取 ALB
- **THEN** 僅允許 TCP port 80 與 443 入站，所有出站流量允許

#### Scenario: ECS Security Group 阻擋非 ALB 流量
- **WHEN** 非 ALB Security Group 來源的流量嘗試存取 ECS task
- **THEN** 流量 SHALL 被拒絕

#### Scenario: RDS Security Group 阻擋非 ECS 流量
- **WHEN** 非 ECS Security Group 來源的流量嘗試存取 RDS port 5432
- **THEN** 流量 SHALL 被拒絕

### Requirement: ECR Container Registry
系統 SHALL 建立兩個 ECR repository（frontend、backend），用於存放 Docker 映像。

#### Scenario: ECR repository 建立成功
- **WHEN** 執行 `terraform apply`
- **THEN** 建立 `mountain-lodge-frontend` 與 `mountain-lodge-backend` 兩個 ECR repository

#### Scenario: ECR repository 不存在時推送失敗
- **WHEN** 嘗試推送映像至不存在的 ECR repository
- **THEN** Docker push SHALL 失敗並回傳錯誤

### Requirement: RDS PostgreSQL 資料庫
系統 SHALL 建立 RDS PostgreSQL 16 實例（db.t3.micro），部署於私有子網，啟用 pgvector 擴充套件。

#### Scenario: RDS 實例建立成功
- **WHEN** 執行 `terraform apply`
- **THEN** 建立 db.t3.micro RDS 實例，引擎為 PostgreSQL 16，分配 20GB gp3 儲存空間，部署於私有子網

#### Scenario: RDS 僅可從 ECS 存取
- **WHEN** 非 ECS Security Group 的來源嘗試連線至 RDS
- **THEN** 連線 SHALL 被拒絕

#### Scenario: pgvector 擴充套件可用
- **WHEN** 連線至 RDS 並執行 `CREATE EXTENSION IF NOT EXISTS vector`
- **THEN** 擴充套件 SHALL 成功啟用

### Requirement: ACM SSL 憑證
系統 SHALL 建立 ACM SSL 憑證（`wsterling.org`），使用 DNS 驗證方式。

#### Scenario: ACM 憑證建立並輸出驗證記錄
- **WHEN** 執行 `terraform apply`
- **THEN** 建立 ACM 憑證並在 Terraform output 輸出 DNS CNAME 驗證記錄（name 與 value）

#### Scenario: DNS 驗證未完成時憑證狀態為 pending
- **WHEN** ACM 憑證建立但 DNS CNAME 記錄尚未新增
- **THEN** 憑證狀態 SHALL 為 `PENDING_VALIDATION`

### Requirement: ALB 負載均衡器
系統 SHALL 建立 Application Load Balancer，配置 HTTPS listener（使用 ACM 憑證）、HTTP→HTTPS 重導向、以及路徑型路由規則 `/mountain-lodge/*`。

#### Scenario: HTTPS 連線成功
- **WHEN** 瀏覽器存取 `https://wsterling.org/mountain-lodge/`
- **THEN** ALB SHALL 使用 ACM 憑證終止 TLS，轉發至 ECS target group

#### Scenario: HTTP 自動重導向至 HTTPS
- **WHEN** 瀏覽器存取 `http://wsterling.org/mountain-lodge/`
- **THEN** ALB SHALL 回傳 301 重導向至 `https://wsterling.org/mountain-lodge/`

#### Scenario: 非 /mountain-lodge/ 路徑回傳 404
- **WHEN** 存取 `https://wsterling.org/other-path`
- **THEN** ALB SHALL 回傳 HTTP 404 固定回應

### Requirement: ECS Fargate 服務
系統 SHALL 建立 ECS Fargate cluster 與 service，運行包含 Nginx 與 Node.js 兩個 container 的 task definition（0.25 vCPU / 0.5 GB 記憶體）。

#### Scenario: ECS task 啟動成功
- **WHEN** ECS service 部署完成
- **THEN** 運行 1 個 Fargate task，包含 nginx container（port 80）與 api container（port 3000）

#### Scenario: ECS task 健康檢查通過
- **WHEN** ALB 對 ECS target group 執行健康檢查（`/mountain-lodge/api/health`）
- **THEN** 健康檢查 SHALL 回傳 HTTP 200

#### Scenario: ECS container 可存取 Secrets Manager
- **WHEN** ECS task 啟動時
- **THEN** container 環境變數 SHALL 從 Secrets Manager 注入 JWT_SECRET、DB_PASSWORD、ANTHROPIC_API_KEY、OPENAI_API_KEY、ADMIN_PASSWORD

### Requirement: Secrets Manager 密鑰管理
系統 SHALL 建立 Secrets Manager secrets 存放敏感設定，ECS task execution role 擁有讀取權限。

#### Scenario: Secret 建立成功
- **WHEN** 執行 `terraform apply`
- **THEN** 建立包含 JWT_SECRET、DB_PASSWORD、ANTHROPIC_API_KEY、OPENAI_API_KEY、ADMIN_PASSWORD 的 Secrets Manager secrets

#### Scenario: 未授權的 IAM 角色無法存取 Secret
- **WHEN** 非 ECS task execution role 嘗試讀取 secret
- **THEN** 存取 SHALL 被拒絕

### Requirement: CloudWatch 日誌
系統 SHALL 建立 CloudWatch Log Group，ECS container 日誌 SHALL 自動推送至 CloudWatch。

#### Scenario: 日誌正確寫入 CloudWatch
- **WHEN** ECS container 產生 stdout/stderr 輸出
- **THEN** 日誌 SHALL 出現在對應的 CloudWatch Log Group 中

#### Scenario: Log Group 不存在時日誌遺失
- **WHEN** CloudWatch Log Group 被刪除
- **THEN** ECS container 日誌 SHALL 無法寫入，CloudWatch 回傳錯誤

### Requirement: Terraform State Backend
系統 SHALL 建立 S3 bucket 與 DynamoDB table 作為 Terraform remote state backend，支援 state locking。

#### Scenario: State backend 建立成功
- **WHEN** 在 `terraform/state/` 執行 `terraform apply`
- **THEN** 建立 S3 bucket（啟用版本控制與加密）與 DynamoDB table（LockID 為 partition key）

#### Scenario: 並行 terraform apply 被鎖定
- **WHEN** 兩個 `terraform apply` 同時執行
- **THEN** 第二個 SHALL 因 DynamoDB lock 而失敗，顯示 state locked 錯誤訊息
