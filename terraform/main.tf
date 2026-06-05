# 1. Terraform Configuration and Remote State (S3)
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

# 2. AWS Provider Setup
provider "aws" {
  region = var.aws_region
}

# 3. Fetch the latest Amazon Linux 2023 AMI automatically
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

# ==========================================
# MICROSERVICE 1: AUTH SERVICE
# ==========================================

# 1.1. Security Group to allow traffic
resource "aws_security_group" "auth_sg" {
  name        = "${var.environment}-auth-service-sg"
  description = "Allow inbound traffic for Auth Service ${upper(var.environment)}"

  ingress {
    description = "Allow Auth Service API traffic"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
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
}

# 1.2. EC2 Instance Provisioning with Docker Compose
resource "aws_instance" "auth_server" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t2.micro"

  vpc_security_group_ids = [aws_security_group.auth_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              
              # Ensure a clean Docker installation in AL2023
              dnf update -y
              dnf install -y docker
              
              # Brief pause to ensure the binary is available
              sleep 5
              
              systemctl start docker
              systemctl enable docker
              usermod -a -G docker ec2-user
              
              # Install Docker Compose v2 and validate version
              curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose
              /usr/local/bin/docker-compose version

              # Create a shared Docker network (force daemon to start first)
              systemctl restart docker
              sleep 5
              docker network create microservices-network || true

              # Copy the separate architecture YAMLs
              cat << 'DBCOMPOSE' > /home/ec2-user/docker-compose.db.yml
${file("${path.module}/../deploy/docker-compose.db.yml")}
              DBCOMPOSE

              cat << 'APPCOMPOSE' > /home/ec2-user/docker-compose.apps.yml
${file("${path.module}/../deploy/docker-compose.apps.yml")}
              APPCOMPOSE

              # Create a complete .env file
              cat << 'ENVFILE' > /home/ec2-user/.env
              IMAGE_TAG=${var.docker_image_tag}
              DB_USER=admin
              DB_PASSWORD=${var.db_password}
              DB_HOST=postgres
              DB_NAME=auth_db
              REDIS_URL=redis://redis:6379
              JWT_SECRET=${var.jwt_secret}
              ENVFILE

              # Deploy databases
              cd /home/ec2-user
              /usr/local/bin/docker-compose -f docker-compose.db.yml --env-file .env up -d postgres redis
              
              echo "Esperando a que las bases de datos inicialicen..."
              sleep 20
              
              # Deploy application
              /usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d auth-service
              EOF

  tags = {
    Name        = "${var.environment}-auth-service-instance"
    Environment = upper(var.environment)
  }
}

# 1.3. Elastic IP Assignment
resource "aws_eip" "auth_eip" {
  instance = aws_instance.auth_server.id
  domain   = "vpc"

  tags = {
    Name        = "${var.environment}-auth-service-eip"
    Environment = upper(var.environment)
  }
}

# 1.4. Output the Elastic IP
output "public_ip" {
  description = "The Elastic Public IP address of the Auth Server"
  value       = aws_eip.auth_eip.public_ip
}


# ==========================================
# MICROSERVICE 2: CATALOG SERVICE
# ==========================================

# 2.1. Security Group for Catalog Service
resource "aws_security_group" "catalog_sg" {
  name        = "${var.environment}-catalog-service-sg"
  description = "Allow inbound traffic for Catalog Service ${upper(var.environment)}"

  ingress {
    description = "Allow Catalog Service API traffic"
    from_port   = 3002
    to_port     = 3002
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
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
}

# 2.2. EC2 Instance Provisioning for Catalog Service
resource "aws_instance" "catalog_server" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t2.micro"

  vpc_security_group_ids = [aws_security_group.catalog_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              
              # Ensure a clean Docker installation in AL2023
              dnf update -y
              dnf install -y docker
              
              # Brief pause to ensure the binary is available
              sleep 5
              
              systemctl start docker
              systemctl enable docker
              usermod -a -G docker ec2-user
              
              # Install Docker Compose v2 and validate version
              curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose
              /usr/local/bin/docker-compose version

              # Create a shared Docker network (force daemon to start first)
              systemctl restart docker
              sleep 5
              docker network create microservices-network || true

              # Copy the separate architecture YAMLs
              cat << 'DBCOMPOSE' > /home/ec2-user/docker-compose.db.yml
${file("${path.module}/../deploy/docker-compose.db.yml")}
              DBCOMPOSE

              cat << 'APPCOMPOSE' > /home/ec2-user/docker-compose.apps.yml
${file("${path.module}/../deploy/docker-compose.apps.yml")}
              APPCOMPOSE

              # Create a complete .env file (Generating the Mongo URI here)
              cat << 'ENVFILE' > /home/ec2-user/.env
              IMAGE_TAG=${var.docker_image_tag}
              MONGO_PASSWORD=${var.mongo_password}
              MONGO_URI=mongodb://admin:${var.mongo_password}@catalog-mongo:27017/catalog_db?authSource=admin
              ENVFILE

              # Deploy database
              cd /home/ec2-user
              /usr/local/bin/docker-compose -f docker-compose.db.yml --env-file .env up -d catalog-mongo
              
              echo "Esperando a que la base de datos inicialice..."
              sleep 20
              
              # Deploy application
              /usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d catalog-service
              EOF

  tags = {
    Name        = "${var.environment}-catalog-server"
    Environment = upper(var.environment)
  }
}

# 2.3. Elastic IP for Catalog Service
resource "aws_eip" "catalog_eip" {
  instance = aws_instance.catalog_server.id
  domain   = "vpc"

  tags = {
    Name        = "${var.environment}-catalog-service-eip"
    Environment = upper(var.environment)
  }
}

# 2.4. Output the Catalog Service IP
output "catalog_public_ip" {
  description = "The Elastic Public IP address of the Catalog Server"
  value       = aws_eip.catalog_eip.public_ip
}