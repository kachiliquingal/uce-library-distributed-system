# ==============================================================================
# Production Environment - Auto Scaling Groups (using Terraform Registry Module)
# ==============================================================================

# ------------------------------------------------------------------------------
# Auth Service ASG
# ------------------------------------------------------------------------------
module "auth_asg" {
  source  = "terraform-aws-modules/autoscaling/aws"
  version = "~> 7.0"

  name = "${var.environment}-auth-service-asg"

  min_size                  = var.asg_min_size
  max_size                  = var.asg_max_size
  desired_capacity          = var.asg_desired_capacity
  wait_for_capacity_timeout = 0
  health_check_type         = "EC2"
  vpc_zone_identifier       = data.aws_subnets.default.ids

  # Launch Template
  launch_template_name        = "${var.environment}-auth-service-lt"
  launch_template_description = "Launch template for Auth Service ${upper(var.environment)}"
  update_default_version      = true

  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.aws_key_name

  security_groups = [aws_security_group.auth_sg.id, aws_security_group.internal_services_sg.id]

  # Target Group attachment for ALB
  target_group_arns = [aws_lb_target_group.auth_tg.arn]

  user_data = base64encode(replace(<<EOF
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
EOF
  , "\r", ""))

  tags = {
    Name        = "${var.environment}-auth-service"
    Environment = upper(var.environment)
    Service     = "auth-service"
  }
}

# ------------------------------------------------------------------------------
# Catalog Service ASG
# ------------------------------------------------------------------------------
module "catalog_asg" {
  source  = "terraform-aws-modules/autoscaling/aws"
  version = "~> 7.0"

  name = "${var.environment}-catalog-service-asg"

  min_size                  = var.asg_min_size
  max_size                  = var.asg_max_size
  desired_capacity          = var.asg_desired_capacity
  wait_for_capacity_timeout = 0
  health_check_type         = "EC2"
  vpc_zone_identifier       = data.aws_subnets.default.ids

  # Launch Template
  launch_template_name        = "${var.environment}-catalog-service-lt"
  launch_template_description = "Launch template for Catalog Service ${upper(var.environment)}"
  update_default_version      = true

  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.aws_key_name

  security_groups = [aws_security_group.catalog_sg.id, aws_security_group.internal_services_sg.id]

  # Target Group attachment for ALB
  target_group_arns = [aws_lb_target_group.catalog_tg.arn]

  user_data = base64encode(replace(<<EOF
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
EOF
  , "\r", ""))

  tags = {
    Name        = "${var.environment}-catalog-service"
    Environment = upper(var.environment)
    Service     = "catalog-service"
  }
}

# ------------------------------------------------------------------------------
# Frontend Service ASG
# ------------------------------------------------------------------------------
module "frontend_asg" {
  source  = "terraform-aws-modules/autoscaling/aws"
  version = "~> 7.0"

  name = "${var.environment}-frontend-service-asg"

  min_size                  = var.asg_min_size
  max_size                  = var.asg_max_size
  desired_capacity          = var.asg_desired_capacity
  wait_for_capacity_timeout = 0
  health_check_type         = "EC2"
  vpc_zone_identifier       = data.aws_subnets.default.ids

  # Launch Template
  launch_template_name        = "${var.environment}-frontend-service-lt"
  launch_template_description = "Launch template for Frontend Service ${upper(var.environment)}"
  update_default_version      = true

  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.aws_key_name

  security_groups = [aws_security_group.frontend_sg.id, aws_security_group.internal_services_sg.id]

  # Target Group attachment for ALB
  target_group_arns = [aws_lb_target_group.frontend_tg.arn]

  user_data = base64encode(replace(<<EOF
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
EOF
  , "\r", ""))

  tags = {
    Name        = "${var.environment}-frontend-service"
    Environment = upper(var.environment)
    Service     = "frontend"
  }
}

# ------------------------------------------------------------------------------
# User Service ASG
# ------------------------------------------------------------------------------
module "user_asg" {
  source  = "terraform-aws-modules/autoscaling/aws"
  version = "~> 7.0"

  name = "${var.environment}-user-service-asg"

  min_size                  = var.asg_min_size
  max_size                  = var.asg_max_size
  desired_capacity          = var.asg_desired_capacity
  wait_for_capacity_timeout = 0
  health_check_type         = "EC2"
  vpc_zone_identifier       = data.aws_subnets.default.ids

  # Launch Template
  launch_template_name        = "${var.environment}-user-service-lt"
  launch_template_description = "Launch template for User Service ${upper(var.environment)}"
  update_default_version      = true

  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.user_instance_type
  key_name      = var.aws_key_name

  security_groups = [aws_security_group.user_sg.id, aws_security_group.internal_services_sg.id]

  # Target Group attachment for ALB
  target_group_arns = [aws_lb_target_group.user_tg.arn]

  user_data = base64encode(replace(<<EOF
#!/bin/bash
until apt-get update && apt-get install -y docker.io; do
  echo "Waiting to release apt lock..."
  sleep 5
done

systemctl start docker
systemctl enable docker
usermod -a -G docker ubuntu

# Create 2GB Swap file to prevent Out Of Memory (OOM) crashes on t3.small
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

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
EOF
  , "\r", ""))

  tags = {
    Name        = "${var.environment}-user-service"
    Environment = upper(var.environment)
    Service     = "user-service"
  }
}

# ------------------------------------------------------------------------------
# Brokers & n8n Server (Standalone EC2)
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

# Create 2GB Swap file to prevent Out Of Memory (OOM) crashes on t3.small
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

  tags = {
    Name        = "${var.environment}-brokers-server"
    Environment = upper(var.environment)
  }

  lifecycle {
    ignore_changes = [user_data, user_data_replace_on_change]
  }
}

# ------------------------------------------------------------------------------
# Loan Service ASG
# ------------------------------------------------------------------------------
module "loan_asg" {
  source  = "terraform-aws-modules/autoscaling/aws"
  version = "~> 7.0"

  name = "${var.environment}-loan-service-asg"

  min_size                  = var.asg_min_size
  max_size                  = var.asg_max_size
  desired_capacity          = var.asg_desired_capacity
  wait_for_capacity_timeout = 0
  health_check_type         = "EC2"
  vpc_zone_identifier       = data.aws_subnets.default.ids

  # Launch Template
  launch_template_name        = "${var.environment}-loan-service-lt"
  launch_template_description = "Launch template for Loan Service ${upper(var.environment)}"
  update_default_version      = true

  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.aws_key_name

  security_groups = [aws_security_group.loan_sg.id, aws_security_group.internal_services_sg.id]

  # Target Group attachment for ALB
  target_group_arns = [aws_lb_target_group.loan_tg.arn]

  user_data = base64encode(replace(<<EOF
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
$${file("$${path.module}/../../deploy/docker-compose.apps.yml")}
APPCOMPOSE

cat << 'ENVFILE' > /home/ubuntu/.env
IMAGE_TAG=$${var.docker_image_tag}
DB_USER=$${var.db_user}
DB_PASSWORD=$${var.db_password}
DB_HOST=$${aws_instance.database_server.private_ip}
DB_NAME=loan_db
RABBITMQ_URL=amqp://admin:$${var.rabbitmq_password}@$${aws_instance.brokers_server.private_ip}:5672
USER_SERVICE_URL=$${aws_lb.main.dns_name}:80
KAFKA_BROKERS=$${aws_instance.brokers_server.private_ip}:9092
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
  , "\r", ""))

  tags = {
    Name        = "${var.environment}-loan-service"
    Environment = upper(var.environment)
    Service     = "loan-service"
  }
}
