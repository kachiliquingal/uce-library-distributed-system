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
# Wait for EBS volume to attach
echo "Waiting for EBS volume /dev/xvdf to attach..."
while [ ! -b /dev/xvdf ]; do
  sleep 5
done

echo "Formatting EBS volume if necessary..."
if ! file -s /dev/xvdf | grep -q 'ext4'; then
  mkfs.ext4 /dev/xvdf
fi

mkdir -p /data
mount /dev/xvdf /data
echo "/dev/xvdf /data ext4 defaults,nofail 0 2" >> /etc/fstab

mkdir -p /data/postgres
chmod 777 /data/postgres

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

cat << 'DBCOMPOSE' > /home/ubuntu/docker-compose.db.yml
${file("${path.module}/../../deploy/docker-compose.db.yml")}
DBCOMPOSE

cat << 'APPCOMPOSE' > /home/ubuntu/docker-compose.apps.yml
${file("${path.module}/../../deploy/docker-compose.apps.yml")}
APPCOMPOSE

cat << 'ENVFILE' > /home/ubuntu/.env
IMAGE_TAG=${var.docker_image_tag}
DB_USER=${var.db_user}
DB_PASSWORD=${var.db_password}
DB_HOST=postgres
DB_NAME=auth_db
REDIS_URL=redis://redis:6379
JWT_SECRET=${var.jwt_secret}
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.db.yml --env-file .env up -d postgres redis
sleep 20
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d auth-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
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

resource "aws_ebs_volume" "auth_db_vol" {
  availability_zone = aws_instance.auth_server.availability_zone
  size              = 10
  type              = "gp3"

  tags = {
    Name        = "${var.environment}-auth-db-vol"
    Environment = upper(var.environment)
  }
}

resource "aws_volume_attachment" "auth_db_att" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.auth_db_vol.id
  instance_id = aws_instance.auth_server.id
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
# Wait for EBS volume to attach
echo "Waiting for EBS volume /dev/xvdf to attach..."
while [ ! -b /dev/xvdf ]; do
  sleep 5
done

echo "Formatting EBS volume if necessary..."
if ! file -s /dev/xvdf | grep -q 'ext4'; then
  mkfs.ext4 /dev/xvdf
fi

mkdir -p /data
mount /dev/xvdf /data
echo "/dev/xvdf /data ext4 defaults,nofail 0 2" >> /etc/fstab

mkdir -p /data/mongo
chmod 777 /data/mongo

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

cat << 'DBCOMPOSE' > /home/ubuntu/docker-compose.db.yml
${file("${path.module}/../../deploy/docker-compose.db.yml")}
DBCOMPOSE

cat << 'APPCOMPOSE' > /home/ubuntu/docker-compose.apps.yml
${file("${path.module}/../../deploy/docker-compose.apps.yml")}
APPCOMPOSE

cat << 'ENVFILE' > /home/ubuntu/.env
IMAGE_TAG=${var.docker_image_tag}
MONGO_PASSWORD=${var.mongo_password}
MONGO_URI=mongodb://admin:${var.mongo_password}@catalog-mongo:27017/catalog_db?authSource=admin
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.db.yml --env-file .env up -d catalog-mongo
sleep 20
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d catalog-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
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

resource "aws_ebs_volume" "catalog_db_vol" {
  availability_zone = aws_instance.catalog_server.availability_zone
  size              = 10
  type              = "gp3"

  tags = {
    Name        = "${var.environment}-catalog-db-vol"
    Environment = upper(var.environment)
  }
}

resource "aws_volume_attachment" "catalog_db_att" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.catalog_db_vol.id
  instance_id = aws_instance.catalog_server.id
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
# Wait for EBS volume to attach
echo "Waiting for EBS volume /dev/xvdf to attach..."
while [ ! -b /dev/xvdf ]; do
  sleep 5
done

echo "Formatting EBS volume if necessary..."
if ! file -s /dev/xvdf | grep -q 'ext4'; then
  mkfs.ext4 /dev/xvdf
fi

mkdir -p /data
mount /dev/xvdf /data
echo "/dev/xvdf /data ext4 defaults,nofail 0 2" >> /etc/fstab

mkdir -p /data/neo4j
chmod 777 /data/neo4j

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

cat << 'DBCOMPOSE' > /home/ubuntu/docker-compose.db.yml
${file("${path.module}/../../deploy/docker-compose.db.yml")}
DBCOMPOSE

cat << 'APPCOMPOSE' > /home/ubuntu/docker-compose.apps.yml
${file("${path.module}/../../deploy/docker-compose.apps.yml")}
APPCOMPOSE

cat << 'ENVFILE' > /home/ubuntu/.env
IMAGE_TAG=${var.docker_image_tag}
NEO4J_PASSWORD=${var.neo4j_password}
NEO4J_URI=bolt://neo4j:7687
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.db.yml --env-file .env up -d neo4j
sleep 20
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d user-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
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

resource "aws_ebs_volume" "user_db_vol" {
  availability_zone = aws_instance.user_server.availability_zone
  size              = 10
  type              = "gp3"

  tags = {
    Name        = "${var.environment}-user-db-vol"
    Environment = upper(var.environment)
  }
}

resource "aws_volume_attachment" "user_db_att" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.user_db_vol.id
  instance_id = aws_instance.user_server.id
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
  -e FRONTEND_SERVICE_URL=${aws_instance.frontend_server.private_ip}:80 \
  --restart always $IMAGE_NAME

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
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

