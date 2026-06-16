# ==============================================================================
# Production Environment - Variables
# ==============================================================================

variable "aws_region" {
  description = "The AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "The deployment environment"
  type        = string
  default     = "prod"
}

variable "docker_image_tag" {
  description = "The specific tag of the Docker image to deploy"
  type        = string
  default     = "latest"
}

variable "instance_type" {
  description = "EC2 instance type for production workloads"
  type        = string
  default     = "t3.micro"
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

variable "aws_key_name" {
  description = "The SSH key pair name for EC2 instances"
  type        = string
  default     = "vockey" # Default name for AWS Educate / Academy
}

variable "mongo_password" {
  description = "MongoDB password for Catalog Service"
  type        = string
  sensitive   = true
}

variable "neo4j_password" {
  description = "Neo4j password for User Service"
  type        = string
  sensitive   = true
}

variable "rabbitmq_password" {
  description = "RabbitMQ password for Brokers Service"
  type        = string
  sensitive   = true
}

# --- ASG Configuration ---

variable "asg_min_size" {
  description = "Minimum number of instances in each Auto Scaling Group"
  type        = number
  default     = 1
}

variable "asg_max_size" {
  description = "Maximum number of instances in each Auto Scaling Group"
  type        = number
  default     = 2
}

variable "asg_desired_capacity" {
  description = "Desired number of instances in each Auto Scaling Group"
  type        = number
  default     = 1
}
