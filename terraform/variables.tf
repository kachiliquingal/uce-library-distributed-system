variable "environment" {
  description = "The deployment environment (qa or prod)"
  type        = string
}

variable "aws_region" {
  description = "The AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "docker_image_tag" {
  description = "The specific tag of the Docker image to deploy"
  type        = string
  default     = "latest"
}