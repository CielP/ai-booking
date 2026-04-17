## 1. 應用程式碼修改

- [x] 1.1 建立 `frontend/src/config.js`，導出 `API_BASE`（讀取 `import.meta.env.VITE_API_BASE`，預設空字串）
- [x] 1.2 更新前端所有 fetch 呼叫，加入 `API_BASE` 前綴（AuthContext.jsx、App.jsx、Login.jsx、Register.jsx、AvailableRooms.jsx、BookRoom.jsx、MyBookings.jsx、AdminDashboard.jsx、ChatWidget.jsx）
- [x] 1.3 更新 `frontend/vite.config.js`，支援透過 `VITE_BASE` 環境變數設定 `base` 路徑
- [x] 1.4 新增 `GET /api/health` 健康檢查端點至 `backend/src/index.js`
- [x] 1.5 更新 `backend/src/index.js` CORS 設定，支援 `CORS_ORIGIN` 環境變數控制允許的來源

## 2. 前端生產建構設定

- [x] 2.1 建立 `frontend/nginx.conf`，設定 `/mountain-lodge/` 靜態檔案服務與 `/mountain-lodge/api/` 反向代理至 `localhost:3000`
- [x] 2.2 建立 `frontend/Dockerfile.prod`，多階段建構（Vite build → Nginx），接受 `VITE_API_BASE` 與 `VITE_BASE` build args

## 3. Terraform State Backend

- [x] 3.1 建立 `terraform/state/main.tf`，定義 S3 bucket（啟用版本控制與加密）與 DynamoDB table（state locking）

## 4. Terraform 核心基礎設施

- [x] 4.1 建立 `terraform/variables.tf`，定義所有輸入變數（region、domain、db credentials、secret values 等）
- [x] 4.2 建立 `terraform/main.tf`，設定 AWS provider 與 S3 backend
- [x] 4.3 建立 `terraform/vpc.tf`，定義 VPC、2 公有子網、2 私有子網、Internet Gateway、路由表
- [x] 4.4 建立 `terraform/security_groups.tf`，定義 ALB、ECS、RDS 三組 Security Group
- [x] 4.5 建立 `terraform/ecr.tf`，定義 frontend 與 backend 兩個 ECR repository
- [x] 4.6 建立 `terraform/secrets.tf`，定義 Secrets Manager secrets（JWT_SECRET、DB_PASSWORD、ANTHROPIC_API_KEY、OPENAI_API_KEY、ADMIN_PASSWORD）
- [x] 4.7 建立 `terraform/rds.tf`，定義 RDS PostgreSQL 16 實例（db.t3.micro）、DB subnet group、parameter group

## 5. Terraform 負載均衡與容器服務

- [x] 5.1 建立 `terraform/acm.tf`，定義 ACM 憑證（DNS 驗證）
- [x] 5.2 建立 `terraform/alb.tf`，定義 ALB、HTTPS listener、HTTP→HTTPS redirect、target group、路徑規則 `/mountain-lodge/*`
- [x] 5.3 建立 `terraform/cloudwatch.tf`，定義 ECS container 的 CloudWatch Log Groups
- [x] 5.4 建立 `terraform/ecs.tf`，定義 ECS cluster、Fargate task definition（Nginx + Node.js sidecar）、ECS service、IAM roles

## 6. Terraform 輸出與部署腳本

- [x] 6.1 建立 `terraform/outputs.tf`，輸出 ALB DNS name、ACM 驗證記錄、RDS endpoint、ECR repo URLs
- [x] 6.2 建立 `scripts/deploy.sh`，自動化 Docker build、ECR push、ECS service 更新
- [x] 6.3 建立 `scripts/init-db.sh`，透過本機 psql 或 ECS run-task 執行 init.sql 初始化 RDS
