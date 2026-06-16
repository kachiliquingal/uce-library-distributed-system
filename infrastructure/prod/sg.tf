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

# ------------------------------------------------------------------------------
# Internal Services Shared Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "internal_services_sg" {
  name_prefix = "${var.environment}-internal-services-sg-"
  description = "Shared SG for internal microservices communication (Membership Tag)"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "Allow all internal traffic between services in this SG"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-internal-services-sg"
    Environment = upper(var.environment)
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ------------------------------------------------------------------------------
# Brokers Security Group (Internal only)
# ------------------------------------------------------------------------------
resource "aws_security_group" "brokers_sg" {
  name_prefix = "${var.environment}-brokers-sg-"
  description = "Allow inbound traffic for Brokers from internal network"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Kafka from Internal Services & API Gateway"
    from_port       = 9092
    to_port         = 9092
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id, aws_security_group.internal_services_sg.id]
  }

  ingress {
    description     = "RabbitMQ AMQP from Internal Services & API Gateway"
    from_port       = 5672
    to_port         = 5672
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id, aws_security_group.internal_services_sg.id]
  }

  ingress {
    description     = "RabbitMQ management UI from API Gateway"
    from_port       = 15672
    to_port         = 15672
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id, aws_security_group.internal_services_sg.id]
  }

  ingress {
    description     = "MQTT from Internal Services & API Gateway"
    from_port       = 1883
    to_port         = 1883
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id, aws_security_group.internal_services_sg.id]
  }

  ingress {
    description     = "n8n UI from API Gateway"
    from_port       = 5678
    to_port         = 5678
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id, aws_security_group.internal_services_sg.id]
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
