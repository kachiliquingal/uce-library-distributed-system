# ==============================================================================
# QA Environment - Variables
# ==============================================================================

variable "aws_region" {
  description = "The AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "The deployment environment"
  type        = string
  default     = "qa"
}

variable "docker_image_tag" {
  description = "The specific tag of the Docker image to deploy"
  type        = string
  default     = "latest"
}

variable "db_password" {
  description = "PostgreSQL password for Auth Service"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT Secret for Auth Service token signing"
  type        = string
  sensitive   = true
}

variable "mongo_password" {
  description = "MongoDB password for Catalog Service"
  type        = string
  sensitive   = true
}

variable "aws_key_name" {
  description = "The SSH key pair name for EC2 instances"
  type        = string
  default     = "vockey" # Default name for AWS Educate
}

variable "rabbitmq_password" {
  description = "RabbitMQ administrator password"
  type        = string
  sensitive   = true
}

variable "db_user" {
  description = "Database administrator username"
  type        = string
  sensitive   = true
}
