# ==============================================================================
# Production Environment - Security Groups
# ==============================================================================

# ------------------------------------------------------------------------------
# API Gateway & Bastion Security Group (Public)
# ------------------------------------------------------------------------------
resource "aws_security_group" "api_gateway_sg" {
  name_prefix = "${var.environment}-api-gateway-sg-"
  description = "Allow inbound HTTP and SSH traffic to API Gateway / Bastion"
  vpc_id      = data.aws_vpc.default.id

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
# Application Load Balancer Security Group (Internal)
# ------------------------------------------------------------------------------
resource "aws_security_group" "alb_sg" {
  name_prefix = "${var.environment}-alb-sg-"
  description = "Allow inbound HTTP traffic to the ALB ONLY from API Gateway"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Allow HTTP traffic from API Gateway"
    from_port       = 80
    to_port         = 80
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
    Name        = "${var.environment}-alb-sg"
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
  description = "Allow traffic from ALB (HTTP) and Bastion (SSH) to Auth Service"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Allow Auth Service API traffic from ALB"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
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
  description = "Allow traffic from ALB (HTTP) and Bastion (SSH) to Catalog Service"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Allow Catalog Service API traffic from ALB"
    from_port       = 3002
    to_port         = 3002
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
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
  description = "Allow traffic from ALB (HTTP) and Bastion (SSH) to Frontend Service"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Allow HTTP web traffic from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
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
# User Service Security Group (Internal only)
# ------------------------------------------------------------------------------
resource "aws_security_group" "user_sg" {
  name_prefix = "${var.environment}-user-service-sg-"
  description = "Allow traffic from ALB (HTTP) and Bastion (SSH) to User Service"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Allow User Service API traffic from ALB"
    from_port       = 3003
    to_port         = 3003
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
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
    Name        = "${var.environment}-user-service-sg"
    Environment = upper(var.environment)
  }

  lifecycle {
    create_before_destroy = true
  }
}
