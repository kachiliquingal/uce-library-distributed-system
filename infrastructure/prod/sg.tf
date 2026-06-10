# ==============================================================================
# Production Environment - Security Groups
# ==============================================================================

# ------------------------------------------------------------------------------
# Application Load Balancer Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "alb_sg" {
  name_prefix = "${var.environment}-alb-sg-"
  description = "Allow inbound HTTP traffic to the ALB ${upper(var.environment)}"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "Allow HTTP traffic from the internet"
    from_port   = 80
    to_port     = 80
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
    Name        = "${var.environment}-alb-sg"
    Environment = upper(var.environment)
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ------------------------------------------------------------------------------
# Auth Service Security Group (Traffic from ALB only)
# ------------------------------------------------------------------------------
resource "aws_security_group" "auth_sg" {
  name_prefix = "${var.environment}-auth-service-sg-"
  description = "Allow traffic from ALB to Auth Service ${upper(var.environment)}"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Allow Auth Service API traffic from ALB"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description = "Allow SSH administration"
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
    Name        = "${var.environment}-auth-service-sg"
    Environment = upper(var.environment)
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ------------------------------------------------------------------------------
# Catalog Service Security Group (Traffic from ALB only)
# ------------------------------------------------------------------------------
resource "aws_security_group" "catalog_sg" {
  name_prefix = "${var.environment}-catalog-service-sg-"
  description = "Allow traffic from ALB to Catalog Service ${upper(var.environment)}"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Allow Catalog Service API traffic from ALB"
    from_port       = 3002
    to_port         = 3002
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description = "Allow SSH administration"
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
    Name        = "${var.environment}-catalog-service-sg"
    Environment = upper(var.environment)
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ------------------------------------------------------------------------------
# Frontend Service Security Group (Traffic from ALB only)
# ------------------------------------------------------------------------------
resource "aws_security_group" "frontend_sg" {
  name_prefix = "${var.environment}-frontend-service-sg-"
  description = "Allow traffic from ALB to Frontend Service ${upper(var.environment)}"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Allow HTTP web traffic from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description = "Allow SSH administration"
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
    Name        = "${var.environment}-frontend-service-sg"
    Environment = upper(var.environment)
  }

  lifecycle {
    create_before_destroy = true
  }
}
