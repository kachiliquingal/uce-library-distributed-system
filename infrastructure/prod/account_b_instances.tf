# ==============================================================================
# Production Environment - EC2 Instances (Cuenta B)
# ==============================================================================

# ------------------------------------------------------------------------------
# Notification Service Instance (MS-04)
# ------------------------------------------------------------------------------
resource "aws_instance" "notification_server" {
  provider      = aws.cuenta_b
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  key_name      = var.aws_key_name
  subnet_id     = aws_subnet.subnet_b.id
  iam_instance_profile = "LabInstanceProfile"

  vpc_security_group_ids = [aws_security_group.peering_sg_b.id]

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
KAFKA_BROKERS=${aws_instance.brokers_server.private_ip}:9092
RABBITMQ_URL=amqp://admin:${var.rabbitmq_password}@${aws_instance.brokers_server.private_ip}:5672
DB_HOST=${aws_instance.database_server.private_ip}
DB_USER=${var.db_user}
DB_PASSWORD=${var.db_password}
DB_NAME=notification_db
EMAIL_USER=${var.email_user}
EMAIL_APP_PASSWORD=${var.email_app_password}
TEST_EMAIL_ADDRESS=${var.test_email_address}
TEST_ADMIN_EMAIL_ADDRESS=${var.test_admin_email_address}
MQTT_BROKER_URL=mqtt://${aws_instance.brokers_server.private_ip}:1883
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d notification-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
  -e DOCKER_API_VERSION=1.44 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart always containrrr/watchtower -i 60 notification-service
EOF
  , "\r\n", "\n")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-ec2-notification"
    Environment = upper(var.environment)
  }
}

# ------------------------------------------------------------------------------
# Fine Service Instance (MS-06)
# ------------------------------------------------------------------------------
resource "aws_instance" "fine_server" {
  provider      = aws.cuenta_b
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  key_name      = var.aws_key_name
  subnet_id     = aws_subnet.subnet_b.id
  iam_instance_profile = "LabInstanceProfile"

  vpc_security_group_ids = [aws_security_group.peering_sg_b.id]

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
KAFKA_BROKERS=${aws_instance.brokers_server.private_ip}:9092
RABBITMQ_URL=amqp://admin:${var.rabbitmq_password}@${aws_instance.brokers_server.private_ip}:5672
DB_HOST=${aws_instance.database_server.private_ip}
DB_USER=${var.db_user}
DB_PASSWORD=${var.db_password}
DB_NAME=fine_db
MQTT_BROKER_URL=mqtt://${aws_instance.brokers_server.private_ip}:1883
STRIPE_SECRET_KEY=${var.stripe_secret_key}
VITE_STRIPE_PUBLIC_KEY=${var.stripe_public_key}
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d fine-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
  -e DOCKER_API_VERSION=1.44 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart always containrrr/watchtower -i 60 fine-service
EOF
  , "\r\n", "\n")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-ec2-fine"
    Environment = upper(var.environment)
  }
}

# ------------------------------------------------------------------------------
# Search Service Instance (MS-10)
# ------------------------------------------------------------------------------
resource "aws_instance" "search_server" {
  provider      = aws.cuenta_b
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  key_name      = var.aws_key_name
  subnet_id     = aws_subnet.subnet_b.id
  iam_instance_profile = "LabInstanceProfile"

  vpc_security_group_ids = [aws_security_group.peering_sg_b.id]

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
KAFKA_BROKERS=${aws_instance.brokers_server.private_ip}:9092
ELASTICSEARCH_URL=http://${aws_instance.database_server.private_ip}:9200
CATALOG_SERVICE_URL=http://${aws_lb.main.dns_name}:80
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d search-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
  -e DOCKER_API_VERSION=1.44 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart always containrrr/watchtower -i 60 search-service
EOF
  , "\r\n", "\n")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-ec2-search"
    Environment = upper(var.environment)
  }
}

# ------------------------------------------------------------------------------
# Inventory Service Instance (MS-09)
# ------------------------------------------------------------------------------
resource "aws_instance" "inventory_server" {
  provider      = aws.cuenta_b
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  key_name      = var.aws_key_name
  subnet_id     = aws_subnet.subnet_b.id
  iam_instance_profile = "LabInstanceProfile"

  vpc_security_group_ids = [aws_security_group.peering_sg_b.id]

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
COUCHDB_URL=http://admin:${var.db_password}@${aws_instance.database_server.private_ip}:5984
KAFKA_BROKERS=${aws_instance.brokers_server.private_ip}:9092
CATALOG_GRPC_HOST=${aws_lb.main.dns_name}:50052
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d inventory-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
  -e DOCKER_API_VERSION=1.44 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart always containrrr/watchtower -i 60 inventory-service
EOF
  , "\r\n", "\n")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-ec2-inventory"
    Environment = upper(var.environment)
  }
}

# ------------------------------------------------------------------------------
# Report Service Instance (MS-07)
# ------------------------------------------------------------------------------
resource "aws_instance" "report_server" {
  provider      = aws.cuenta_b
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  key_name      = var.aws_key_name
  subnet_id     = aws_subnet.subnet_b.id
  iam_instance_profile = "LabInstanceProfile"

  vpc_security_group_ids = [aws_security_group.peering_sg_b.id]

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
INFLUXDB_URL=http://${aws_instance.database_server.private_ip}:8086
INFLUXDB_TOKEN=uce_library_admin_token_secret_123
INFLUXDB_ORG=uce_library
INFLUXDB_BUCKET=reports
KAFKA_BROKERS=${aws_instance.brokers_server.private_ip}:9092
LOAN_SERVICE_INTERNAL_URL=http://${aws_lb.main.dns_name}:80
FINE_SERVICE_INTERNAL_URL=${aws_instance.fine_server.private_ip}:3006
CATALOG_SERVICE_INTERNAL_URL=http://${aws_lb.main.dns_name}:80
USER_SERVICE_URL=http://${aws_lb.main.dns_name}:80
PORT=4007
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d report-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
  -e DOCKER_API_VERSION=1.44 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart always containrrr/watchtower -i 60 report-service
EOF
  , "\r\n", "\n")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-ec2-report"
    Environment = upper(var.environment)
  }
}

# ------------------------------------------------------------------------------
# DynamoDB Table for Reservations (DB-09 / INFRA-11)
# ------------------------------------------------------------------------------
resource "aws_dynamodb_table" "reservations" {
  provider     = aws.cuenta_b
  name         = "Reservations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  tags = {
    Name        = "${var.environment}-Reservations"
    Environment = upper(var.environment)
  }
}

# ------------------------------------------------------------------------------
# Reservation Service Instance (MS-08 / INFRA-11)
# ------------------------------------------------------------------------------
resource "aws_instance" "reservation_server" {
  provider      = aws.cuenta_b
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  key_name      = var.aws_key_name
  subnet_id     = aws_subnet.subnet_b.id
  iam_instance_profile = "LabInstanceProfile"

  vpc_security_group_ids = [aws_security_group.peering_sg_b.id]

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
BROKERS_IP=${aws_instance.brokers_server.private_ip}
KAFKA_BROKERS=${aws_instance.brokers_server.private_ip}:9092
AWS_DEFAULT_REGION=us-east-1
DYNAMODB_TABLE_NAME=${aws_dynamodb_table.reservations.name}
PORT=4008
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d reservation-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
  -e DOCKER_API_VERSION=1.44 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart always containrrr/watchtower -i 60 reservation-service
EOF
  , "\r\n", "\n")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-ec2-reservation"
    Environment = upper(var.environment)
  }
}

