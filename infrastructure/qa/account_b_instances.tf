# ==============================================================================
# QA Environment - EC2 Instances (Cuenta B)
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
DB_NAME=auth_db
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
    Name = "ec2-notification"
  }
}
