terraform {
  required_version = ">= 1.5"

  backend "s3" {
    bucket         = "mountain-lodge-terraform-state"
    key            = "terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "mountain-lodge-terraform-locks"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
