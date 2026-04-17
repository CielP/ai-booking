#!/bin/bash
set -euo pipefail

# Initialize RDS database using docker/init.sql
# Requires psql installed locally and network access to RDS
# (e.g., via SSH tunnel or from a machine in the VPC)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TF_DIR="$PROJECT_DIR/terraform"
INIT_SQL="$PROJECT_DIR/docker/init.sql"

echo "==> Reading Terraform outputs..."
cd "$TF_DIR"
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
RDS_HOST=$(echo "$RDS_ENDPOINT" | cut -d: -f1)
RDS_PORT=$(echo "$RDS_ENDPOINT" | cut -d: -f2)

echo ""
echo "RDS Endpoint: $RDS_ENDPOINT"
echo "Init SQL:     $INIT_SQL"
echo ""
echo "NOTE: You must have network access to the RDS instance."
echo "      The RDS is in a private subnet. Options:"
echo "      1. Run this script from an EC2 instance in the same VPC"
echo "      2. Use an SSH tunnel through a bastion host"
echo "      3. Temporarily add your IP to the RDS security group"
echo ""

read -p "Database username [hotel]: " DB_USER
DB_USER=${DB_USER:-hotel}

read -sp "Database password: " DB_PASS
echo ""

read -p "Database name [hoteldb]: " DB_NAME
DB_NAME=${DB_NAME:-hoteldb}

echo "==> Running init.sql against RDS..."
PGPASSWORD="$DB_PASS" psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$INIT_SQL"

echo ""
echo "==> Database initialization complete!"
