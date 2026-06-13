# ==============================================================================
# Production Environment - API Gateway & Bastion Instance
# ==============================================================================

resource "aws_instance" "api_gateway_server" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t2.micro"

  vpc_security_group_ids = [aws_security_group.api_gateway_sg.id]

  user_data = replace(<<EOF
#!/bin/bash
until dnf install -y docker; do
  echo "Waiting to release DNF lock..."
  sleep 5
done

systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

IMAGE_NAME="kachiliquingal/uce-api-gateway:${var.docker_image_tag}"

# Run API Gateway Nginx proxy container routing traffic to the internal ALB
docker run -d -p 80:80 --name uce-api-gateway \
  -e AUTH_SERVICE_URL=${aws_lb.main.dns_name}:80 \
  -e CATALOG_SERVICE_URL=${aws_lb.main.dns_name}:80 \
  -e FRONTEND_SERVICE_URL=${aws_lb.main.dns_name}:80 \
  -e USER_SERVICE_URL=localhost:3003 \
  --restart always $IMAGE_NAME

# Watchtower - Auto-updates Docker images every 60 seconds
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower -i 60 uce-api-gateway
EOF
  , "\r", "")

  tags = {
    Name        = "${var.environment}-api-gateway-server"
    Environment = upper(var.environment)
  }

  lifecycle {
    ignore_changes = [user_data, ami]
  }
}
