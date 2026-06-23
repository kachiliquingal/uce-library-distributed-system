# ==============================================================================
# QA Environment - EC2 Instances
# ==============================================================================

# ------------------------------------------------------------------------------
# Auth Service Instance
# ------------------------------------------------------------------------------
resource "aws_instance" "auth_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  key_name      = var.aws_key_name

  vpc_security_group_ids = [aws_security_group.auth_sg.id, aws_security_group.internal_services_sg.id]

  user_data = replace(<<EOF
#!/bin/bash
until apt-get update && apt-get install -y docker.io; do
  echo "Waiting to release apt lock..."
  sleep 5
done

systemctl start docker
systemctl enable docker
usermod -a -G docker ubuntu

curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

systemctl restart docker
sleep 5
docker network create microservices-network || true

cat << 'APPCOMPOSE' > /home/ubuntu/docker-compose.apps.yml
${file("${path.module}/../../deploy/docker-compose.apps.yml")}
APPCOMPOSE

cat << 'ENVFILE' > /home/ubuntu/.env
IMAGE_TAG=${var.docker_image_tag}
DB_USER=${var.db_user}
DB_PASSWORD=${var.db_password}
DB_HOST=${aws_instance.database_server.private_ip}
DB_NAME=auth_db
REDIS_URL=redis://${aws_instance.database_server.private_ip}:6379
JWT_SECRET=${var.jwt_secret}
KAFKA_BROKERS=${aws_instance.brokers_server.private_ip}:9092
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d auth-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
  -e DOCKER_API_VERSION=1.44 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower -i 60 auth-service

# Force recreation v2
EOF
  , "\r", "")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-auth-service-instance"
    Environment = upper(var.environment)
  }
}



# ------------------------------------------------------------------------------
# Catalog Service Instance
# ------------------------------------------------------------------------------
resource "aws_instance" "catalog_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  key_name      = var.aws_key_name

  vpc_security_group_ids = [aws_security_group.catalog_sg.id, aws_security_group.internal_services_sg.id]

  user_data = replace(<<EOF
#!/bin/bash
until apt-get update && apt-get install -y docker.io; do
  echo "Waiting to release apt lock..."
  sleep 5
done

systemctl start docker
systemctl enable docker
usermod -a -G docker ubuntu

curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

systemctl restart docker
sleep 5
docker network create microservices-network || true

cat << 'APPCOMPOSE' > /home/ubuntu/docker-compose.apps.yml
${file("${path.module}/../../deploy/docker-compose.apps.yml")}
APPCOMPOSE

cat << 'ENVFILE' > /home/ubuntu/.env
IMAGE_TAG=${var.docker_image_tag}
MONGO_PASSWORD=${var.mongo_password}
MONGO_URI=mongodb://admin:${var.mongo_password}@${aws_instance.database_server.private_ip}:27017/catalog_db?authSource=admin
KAFKA_BROKERS=${aws_instance.brokers_server.private_ip}:9092
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d catalog-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
  -e DOCKER_API_VERSION=1.44 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower -i 60 catalog-service

# Force recreation v2
EOF
  , "\r", "")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-catalog-server"
    Environment = upper(var.environment)
  }
}



# ------------------------------------------------------------------------------
# User Service Instance
# ------------------------------------------------------------------------------
resource "aws_instance" "user_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.small"
  key_name      = var.aws_key_name

  vpc_security_group_ids = [aws_security_group.user_sg.id, aws_security_group.internal_services_sg.id]

  user_data = replace(<<EOF
#!/bin/bash
# Create 2GB Swap file to prevent Out Of Memory (OOM) crashes on t3.small
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

until apt-get update && apt-get install -y docker.io; do
  echo "Waiting to release apt lock..."
  sleep 5
done

systemctl start docker
systemctl enable docker
usermod -a -G docker ubuntu

curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

systemctl restart docker
sleep 5
docker network create microservices-network || true

cat << 'APPCOMPOSE' > /home/ubuntu/docker-compose.apps.yml
${file("${path.module}/../../deploy/docker-compose.apps.yml")}
APPCOMPOSE

cat << 'ENVFILE' > /home/ubuntu/.env
IMAGE_TAG=${var.docker_image_tag}
NEO4J_PASSWORD=${var.neo4j_password}
NEO4J_URI=bolt://${aws_instance.database_server.private_ip}:7687
KAFKA_BROKERS=${aws_instance.brokers_server.private_ip}:9092
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d user-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
  -e DOCKER_API_VERSION=1.44 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower -i 60 user-service

# Force recreation v3
EOF
  , "\r", "")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-user-server"
    Environment = upper(var.environment)
  }
}



# ------------------------------------------------------------------------------
# Frontend Service Instance
# ------------------------------------------------------------------------------
resource "aws_instance" "frontend_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  key_name      = var.aws_key_name

  vpc_security_group_ids = [aws_security_group.frontend_sg.id, aws_security_group.internal_services_sg.id]

  user_data = replace(<<EOF
#!/bin/bash
until apt-get update && apt-get install -y docker.io; do
  echo "Waiting to release apt lock..."
  sleep 5
done

systemctl start docker
systemctl enable docker
usermod -a -G docker ubuntu

IMAGE_NAME="kachiliquingal/uce-frontend:${var.docker_image_tag}"

# Launch the frontend container
docker run -d -p 80:80 --name uce-frontend --restart always $IMAGE_NAME

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
  -e DOCKER_API_VERSION=1.44 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower -i 60 uce-frontend

# Force recreation v2
EOF
  , "\r", "")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-frontend-server"
    Environment = upper(var.environment)
  }
}

# ------------------------------------------------------------------------------
# API Gateway & Bastion Instance
# ------------------------------------------------------------------------------
resource "aws_instance" "api_gateway_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  key_name      = var.aws_key_name

  vpc_security_group_ids = [aws_security_group.api_gateway_sg.id]

  user_data = replace(<<EOF
#!/bin/bash
until apt-get update && apt-get install -y docker.io telnet; do
  echo "Waiting to release apt lock..."
  sleep 5
done

systemctl start docker
systemctl enable docker
usermod -a -G docker ubuntu

IMAGE_NAME="kachiliquingal/uce-api-gateway:${var.docker_image_tag}"

# Run API Gateway Nginx proxy container with private IPs of other instances
docker run -d -p 80:80 --name uce-api-gateway \
  -e AUTH_SERVICE_URL=${aws_instance.auth_server.private_ip}:3001 \
  -e CATALOG_SERVICE_URL=${aws_instance.catalog_server.private_ip}:3002 \
  -e USER_SERVICE_URL=${aws_instance.user_server.private_ip}:3003 \
  -e LOAN_SERVICE_URL=${aws_instance.loan_server.private_ip}:3004 \
  -e FRONTEND_SERVICE_URL=${aws_instance.frontend_server.private_ip}:80 \
  --restart always $IMAGE_NAME

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
  -e DOCKER_API_VERSION=1.44 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower -i 60 uce-api-gateway
EOF
  , "\r", "")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-api-gateway-server"
    Environment = upper(var.environment)
  }
}

# ------------------------------------------------------------------------------
# Brokers & n8n Server (INFRA-02)
# ------------------------------------------------------------------------------
resource "aws_instance" "brokers_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.small"
  key_name      = var.aws_key_name

  vpc_security_group_ids = [aws_security_group.brokers_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = replace(<<EOF
#!/bin/bash
until apt-get update && apt-get install -y docker.io; do
  echo "Waiting to release apt lock..."
  sleep 5
done

systemctl start docker
systemctl enable docker
usermod -a -G docker ubuntu

# Create 2GB Swap file to prevent Out Of Memory (OOM) crashes on t3.micro
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

systemctl restart docker
sleep 5
docker network create brokers-network || true

cat << 'BROKERSCOMPOSE' > /home/ubuntu/docker-compose.brokers.yml
${file("${path.module}/../../deploy/docker-compose.brokers.yml")}
BROKERSCOMPOSE

cat << 'MQTTCONF' > /home/ubuntu/mosquitto.conf
${file("${path.module}/../../deploy/mosquitto.conf")}
MQTTCONF

cat << 'RMQCONF' > /home/ubuntu/rabbitmq.conf
${file("${path.module}/../../deploy/rabbitmq.conf")}
RMQCONF

cat << 'RMQDEF' > /home/ubuntu/rabbitmq_definitions.json
${file("${path.module}/../../deploy/rabbitmq_definitions.json")}
RMQDEF

cat << ENVFILE > /home/ubuntu/.env
HOST_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
RABBITMQ_PASSWORD=${var.rabbitmq_password}
KAFKA_REPLICATION_FACTOR=1
ENVFILE

# Create n8n data directory and fix permissions
mkdir -p /home/ubuntu/.n8n
chown -R 1000:1000 /home/ubuntu/.n8n

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.brokers.yml --env-file .env up -d
EOF
  , "\r", "")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-brokers-server"
    Environment = upper(var.environment)
  }
}

# ------------------------------------------------------------------------------
# Loan Service Instance
# ------------------------------------------------------------------------------
resource "aws_instance" "loan_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  key_name      = var.aws_key_name

  vpc_security_group_ids = [aws_security_group.loan_sg.id, aws_security_group.internal_services_sg.id]

  user_data = replace(<<EOF
#!/bin/bash
until apt-get update && apt-get install -y docker.io; do
  echo "Waiting to release apt lock..."
  sleep 5
done

systemctl start docker
systemctl enable docker
usermod -a -G docker ubuntu

curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

systemctl restart docker
sleep 5
docker network create microservices-network || true

cat << 'APPCOMPOSE' > /home/ubuntu/docker-compose.apps.yml
${file("${path.module}/../../deploy/docker-compose.apps.yml")}
APPCOMPOSE

cat << 'ENVFILE' > /home/ubuntu/.env
IMAGE_TAG=${var.docker_image_tag}
DB_USER=${var.db_user}
DB_PASSWORD=${var.db_password}
DB_HOST=${aws_instance.database_server.private_ip}
DB_NAME=loan_db
RABBITMQ_PASSWORD=${var.rabbitmq_password}
KAFKA_BROKERS=${aws_instance.brokers_server.private_ip}:9092
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d loan-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
  -e DOCKER_API_VERSION=1.44 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower -i 60 loan-service

EOF
  , "\r", "")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-loan-server"
    Environment = upper(var.environment)
  }
}
