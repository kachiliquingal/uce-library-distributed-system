# ==============================================================================
# QA Environment - Security Groups
# ==============================================================================

# ------------------------------------------------------------------------------
# API Gateway & Bastion Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "api_gateway_sg" {
  name_prefix = "${var.environment}-api-gateway-sg-"
  description = "Allow inbound HTTP and SSH traffic to API Gateway / Bastion"

  ingress {
    description = "Allow HTTP web traffic from the internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow SSH administration from the internet"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-api-gateway-sg"
    Environment = upper(var.environment)
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ------------------------------------------------------------------------------
# Auth Service Security Group (Internal only)
# ------------------------------------------------------------------------------
resource "aws_security_group" "auth_sg" {
  name_prefix = "${var.environment}-auth-service-sg-"
  description = "Allow inbound traffic for Auth Service ${upper(var.environment)} ONLY from API Gateway"

  ingress {
    description     = "Allow Auth Service API traffic from API Gateway"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id]
  }

  ingress {
    description     = "Allow SSH administration from Bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-auth-service-sg"
    Environment = upper(var.environment)
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ------------------------------------------------------------------------------
# Catalog Service Security Group (Internal only)
# ------------------------------------------------------------------------------
resource "aws_security_group" "catalog_sg" {
  name_prefix = "${var.environment}-catalog-service-sg-"
  description = "Allow inbound traffic for Catalog Service ${upper(var.environment)} ONLY from API Gateway"

  ingress {
    description     = "Allow Catalog Service API traffic from API Gateway"
    from_port       = 3002
    to_port         = 3002
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id]
  }

  ingress {
    description     = "Allow SSH administration from Bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-catalog-service-sg"
    Environment = upper(var.environment)
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ------------------------------------------------------------------------------
# Frontend Service Security Group (Internal only)
# ------------------------------------------------------------------------------
resource "aws_security_group" "frontend_sg" {
  name_prefix = "${var.environment}-frontend-service-sg-"
  description = "Allow inbound traffic for Frontend Service ${upper(var.environment)} ONLY from API Gateway"

  ingress {
    description     = "Allow HTTP web traffic from API Gateway"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id]
  }

  ingress {
    description     = "Allow SSH administration from Bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-frontend-service-sg"
    Environment = upper(var.environment)
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ------------------------------------------------------------------------------
# Brokers Security Group (Internal only)
# ------------------------------------------------------------------------------

data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "brokers_sg" {
  name_prefix = "${var.environment}-brokers-sg-"
  description = "Allow inbound traffic for Brokers from internal network"

  ingress {
    description = "Allow internal traffic to all broker ports from VPC"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.default.cidr_block]
  }

  ingress {
    description     = "Allow SSH administration from Bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-brokers-sg"
    Environment = upper(var.environment)
  }

  lifecycle {
    create_before_destroy = true
  }
}
