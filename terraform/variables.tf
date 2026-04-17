variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "mountain-lodge"
}

variable "domain_name" {
  description = "Domain name for the website"
  type        = string
  default     = "wsterling.org"
}

variable "app_path" {
  description = "Subpath for the application"
  type        = string
  default     = "/mountain-lodge"
}

# Database
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "hoteldb"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "hotel"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# Secrets
variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "jwt_expires_in" {
  description = "JWT token expiry duration"
  type        = string
  default     = "7d"
}

variable "admin_password" {
  description = "Admin account password (must match bcrypt hash in init.sql)"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key for Claude"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key for embeddings"
  type        = string
  sensitive   = true
}

# ECS
variable "ecs_cpu" {
  description = "Fargate task CPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "ecs_memory" {
  description = "Fargate task memory in MiB"
  type        = number
  default     = 512
}

# RDS
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}
