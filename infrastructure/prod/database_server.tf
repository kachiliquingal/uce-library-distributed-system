# ==============================================================================
# QA Environment - Dedicated Database Server
# ==============================================================================

resource "aws_security_group" "database_sg" {
  name_prefix = "${var.environment}-database-sg-"
  description = "Allow inbound traffic for databases from internal network"

  # PostgreSQL
  ingress {
    description     = "PostgreSQL from Internal Services & API Gateway"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id, aws_security_group.internal_services_sg.id]
    cidr_blocks     = [aws_vpc.vpc_b.cidr_block]
  }

  # Redis
  ingress {
    description     = "Redis from Internal Services & API Gateway"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id, aws_security_group.internal_services_sg.id]
  }

  # MongoDB
  ingress {
    description     = "MongoDB from Internal Services & API Gateway"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id, aws_security_group.internal_services_sg.id]
  }

  # Neo4j HTTP/Browser
  ingress {
    description     = "Neo4j HTTP from API Gateway"
    from_port       = 7474
    to_port         = 7474
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id, aws_security_group.internal_services_sg.id]
  }

  # Neo4j Bolt
  ingress {
    description     = "Neo4j Bolt from Internal Services & API Gateway"
    from_port       = 7687
    to_port         = 7687
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id, aws_security_group.internal_services_sg.id]
  }

  # SSH from Bastion
  ingress {
    description     = "Allow SSH administration from Bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-database-sg"
    Environment = upper(var.environment)
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_instance" "database_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.small" # t3.small provides 2GB RAM, needed for Neo4j+Mongo+Postgres
  key_name      = var.aws_key_name

  vpc_security_group_ids = [aws_security_group.database_sg.id, aws_security_group.internal_services_sg.id]

  user_data = replace(<<EOF
#!/bin/bash
# Wait for EBS volume to attach
echo "Waiting for EBS volume to attach..."
DEVICE="/dev/xvdf"
while true; do
  if [ -b "/dev/nvme1n1" ]; then DEVICE="/dev/nvme1n1"; break; fi
  if [ -b "/dev/xvdf" ]; then DEVICE="/dev/xvdf"; break; fi
  sleep 5
done

echo "Formatting EBS volume if necessary..."
if ! file -s $DEVICE | grep -q 'ext4'; then
  mkfs.ext4 $DEVICE
fi

mkdir -p /data
mount $DEVICE /data
echo "$DEVICE /data ext4 defaults,nofail 0 2" >> /etc/fstab

mkdir -p /data/postgres /data/mongo /data/neo4j
chmod 777 /data/postgres /data/mongo /data/neo4j

# Create 2GB Swap file to prevent Out Of Memory (OOM) crashes
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

cat << 'ENVFILE' > /home/ubuntu/.env
DB_USER=${var.db_user}
DB_PASSWORD=${var.db_password}
MONGO_PASSWORD=${var.mongo_password}
NEO4J_PASSWORD=${var.neo4j_password}
ENVFILE

cd /home/ubuntu
/usr/local/bin/docker-compose -f docker-compose.db.yml --env-file .env up -d

# Ensure notification_db and fine_db exist (Microservices Best Practice: Database per Service)
echo "Waiting for PostgreSQL to start..."
sleep 15
docker exec -e PGPASSWORD=${var.db_password} $(docker-compose -f docker-compose.db.yml ps -q postgres) psql -U ${var.db_user} -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'notification_db'" | grep -q 1 || docker exec -e PGPASSWORD=${var.db_password} $(docker-compose -f docker-compose.db.yml ps -q postgres) psql -U ${var.db_user} -d postgres -c "CREATE DATABASE notification_db;"
docker exec -e PGPASSWORD=${var.db_password} $(docker-compose -f docker-compose.db.yml ps -q postgres) psql -U ${var.db_user} -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'fine_db'" | grep -q 1 || docker exec -e PGPASSWORD=${var.db_password} $(docker-compose -f docker-compose.db.yml ps -q postgres) psql -U ${var.db_user} -d postgres -c "CREATE DATABASE fine_db;"

EOF
  , "\r", "")

  tags = {
    Name        = "${var.environment}-database-server"
    Environment = upper(var.environment)
  }
}

resource "aws_ebs_volume" "database_vol" {
  availability_zone = aws_instance.database_server.availability_zone
  size              = 20
  type              = "gp3"

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [availability_zone]
  }

  tags = {
    Name        = "${var.environment}-database-vol"
    Environment = upper(var.environment)
  }
}

resource "aws_volume_attachment" "database_att" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.database_vol.id
  instance_id = aws_instance.database_server.id
}
