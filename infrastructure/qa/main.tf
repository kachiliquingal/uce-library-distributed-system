# ==============================================================================
# QA Environment - Terraform Configuration
# ==============================================================================

terraform {
  backend "s3" {
    region = "us-east-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ------------------------------------------------------------------------------
# Provider
# ------------------------------------------------------------------------------
provider "aws" {
  region = var.aws_region
}

# ------------------------------------------------------------------------------
# Data Sources
# ------------------------------------------------------------------------------
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

provider "aws" {
  alias      = "cuenta_b"
  region     = var.aws_region
  access_key = var.cuenta_b_aws_access_key_id
  secret_key = var.cuenta_b_aws_secret_access_key
  token      = var.cuenta_b_aws_session_token
}
