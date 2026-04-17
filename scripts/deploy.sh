#!/bin/bash
set -euo pipefail

# Configuration — read from Terraform outputs
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TF_DIR="$PROJECT_DIR/terraform"

echo "==> Reading Terraform outputs..."
cd "$TF_DIR"
ECR_FRONTEND=$(terraform output -raw ecr_frontend_url)
ECR_BACKEND=$(terraform output -raw ecr_backend_url)
ECS_CLUSTER=$(terraform output -raw ecs_cluster_name)
ECS_SERVICE=$(terraform output -raw ecs_service_name)
AWS_REGION=$(terraform output -raw 2>/dev/null || echo "ap-northeast-1")

# Extract AWS account ID from ECR URL
AWS_ACCOUNT_ID=$(echo "$ECR_FRONTEND" | cut -d. -f1)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

cd "$PROJECT_DIR"

echo "==> Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "==> Building frontend image (linux/amd64)..."
docker build --platform linux/amd64 -t "${ECR_FRONTEND}:latest" -f frontend/Dockerfile.prod frontend/

echo "==> Building backend image (linux/amd64)..."
docker build --platform linux/amd64 -t "${ECR_BACKEND}:latest" backend/

echo "==> Pushing frontend image..."
docker push "${ECR_FRONTEND}:latest"

echo "==> Pushing backend image..."
docker push "${ECR_BACKEND}:latest"

echo "==> Updating ECS service (force new deployment)..."
aws ecs update-service \
  --cluster "$ECS_CLUSTER" \
  --service "$ECS_SERVICE" \
  --force-new-deployment \
  --region "$AWS_REGION" \
  --no-cli-pager

echo ""
echo "==> Deployment initiated!"
echo "    Check status: aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION --query 'services[0].deployments' --no-cli-pager"
