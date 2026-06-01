# 1. Terraform Configuration and Remote State (S3)
terraform {
  backend "s3" {
    # The bucket and key are dynamically injected via CLI in GitHub Actions
    # to support multiple AWS Academy accounts.
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

# 4. Security Group to allow traffic
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

# 5. EC2 Instance Provisioning with Docker Compose
resource "aws_instance" "auth_server" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t2.micro"

  vpc_security_group_ids = [aws_security_group.auth_sg.id]

  # User Data Script: Install Docker, standalone docker-compose, and run the stack
  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker
              systemctl start docker
              systemctl enable docker
              
              # Install Docker Compose standalone binary
              curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose

              # Create Docker Compose file dynamically
              cat << 'COMPOSE' > /home/ec2-user/docker-compose.yml
              version: '3.8'
              
              services:
                postgres:
                  image: postgres:15-alpine
                  environment:
                    POSTGRES_USER: admin
                    POSTGRES_PASSWORD: adminpassword
                    POSTGRES_DB: auth_db
                  ports:
                    - "5432:5432"
                  volumes:
                    - postgres_data:/var/lib/postgresql/data
                
                redis:
                  image: redis:7-alpine
                  ports:
                    - "6379:6379"
                
                auth-service:
                  image: kachiliquingal/uce-auth-service:${var.docker_image_tag}
                  ports:
                    - "3001:3001"
                  environment:
                    - PORT=3001
                    - DB_USER=admin
                    - DB_PASSWORD=adminpassword
                    - DB_HOST=postgres
                    - DB_PORT=5432
                    - DB_NAME=auth_db
                    - REDIS_URL=redis://redis:6379
                    - JWT_SECRET=super_secret_key_for_jwt_auth_uce
                  depends_on:
                    - postgres
                    - redis
              
              volumes:
                postgres_data:
              COMPOSE

              # Run the stack using the explicit binary path
              cd /home/ec2-user
              /usr/local/bin/docker-compose up -d
              EOF

  tags = {
    Name        = "${var.environment}-auth-service-instance"
    Environment = upper(var.environment)
  }
}

# 6. Elastic IP Assignment
resource "aws_eip" "auth_eip" {
  instance = aws_instance.auth_server.id
  domain   = "vpc"

  tags = {
    Name        = "${var.environment}-auth-service-eip"
    Environment = upper(var.environment)
  }
}

# 7. Output the Elastic IP to easily access the service
output "public_ip" {
  description = "The Elastic Public IP address of the Auth Server"
  value       = aws_eip.auth_eip.public_ip
}