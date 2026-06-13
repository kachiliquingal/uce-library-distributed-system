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

  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  security_groups = [aws_security_group.auth_sg.id]

  # Target Group attachment for ALB
  target_group_arns = [aws_lb_target_group.auth_tg.arn]

  user_data = base64encode(replace(<<EOF
#!/bin/bash
until dnf install -y docker; do
  echo "Waiting to release DNF lock..."
  sleep 5
done

systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

systemctl restart docker
sleep 5
docker network create microservices-network || true

cat << 'DBCOMPOSE' > /home/ec2-user/docker-compose.db.yml
${file("${path.module}/../../deploy/docker-compose.db.yml")}
DBCOMPOSE

cat << 'APPCOMPOSE' > /home/ec2-user/docker-compose.apps.yml
${file("${path.module}/../../deploy/docker-compose.apps.yml")}
APPCOMPOSE

cat << 'ENVFILE' > /home/ec2-user/.env
IMAGE_TAG=${var.docker_image_tag}
DB_USER=admin
DB_PASSWORD=${var.db_password}
DB_HOST=postgres
DB_NAME=auth_db
REDIS_URL=redis://redis:6379
JWT_SECRET=${var.jwt_secret}
ENVFILE

cd /home/ec2-user
/usr/local/bin/docker-compose -f docker-compose.db.yml --env-file .env up -d postgres redis
sleep 20
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d auth-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
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

  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  security_groups = [aws_security_group.catalog_sg.id]

  # Target Group attachment for ALB
  target_group_arns = [aws_lb_target_group.catalog_tg.arn]

  user_data = base64encode(replace(<<EOF
#!/bin/bash
until dnf install -y docker; do
  echo "Waiting to release DNF lock..."
  sleep 5
done

systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

systemctl restart docker
sleep 5
docker network create microservices-network || true

cat << 'DBCOMPOSE' > /home/ec2-user/docker-compose.db.yml
${file("${path.module}/../../deploy/docker-compose.db.yml")}
DBCOMPOSE

cat << 'APPCOMPOSE' > /home/ec2-user/docker-compose.apps.yml
${file("${path.module}/../../deploy/docker-compose.apps.yml")}
APPCOMPOSE

cat << 'ENVFILE' > /home/ec2-user/.env
IMAGE_TAG=${var.docker_image_tag}
MONGO_PASSWORD=${var.mongo_password}
MONGO_URI=mongodb://admin:${var.mongo_password}@catalog-mongo:27017/catalog_db?authSource=admin
ENVFILE

cd /home/ec2-user
/usr/local/bin/docker-compose -f docker-compose.db.yml --env-file .env up -d catalog-mongo
sleep 20
/usr/local/bin/docker-compose -f docker-compose.apps.yml --env-file .env up -d catalog-service

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
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

  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  security_groups = [aws_security_group.frontend_sg.id]

  # Target Group attachment for ALB
  target_group_arns = [aws_lb_target_group.frontend_tg.arn]

  user_data = base64encode(replace(<<EOF
#!/bin/bash
until dnf install -y docker; do
  echo "Waiting to release DNF lock..."
  sleep 5
done

systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

IMAGE_NAME="kachiliquingal/uce-frontend:${var.docker_image_tag}"

# Launch the frontend container
docker run -d -p 80:80 --name uce-frontend --restart always $IMAGE_NAME

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
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
