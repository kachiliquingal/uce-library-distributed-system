# ==============================================================================
# QA Environment - VPC Peering (Cuenta A <-> Cuenta B)
# ==============================================================================

# Data Sources
data "aws_vpc" "cuenta_a" {
  default = true
}

data "aws_caller_identity" "cuenta_a" {}

data "aws_caller_identity" "cuenta_b" {
  provider = aws.cuenta_b
}

# --- 1. Infrastructure in Cuenta B ---

resource "aws_vpc" "vpc_b" {
  provider             = aws.cuenta_b
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "CuentaB-VPC"
  }
}

resource "aws_subnet" "subnet_b" {
  provider                = aws.cuenta_b
  vpc_id                  = aws_vpc.vpc_b.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true

  tags = {
    Name = "CuentaB-Subnet-Public"
  }
}

resource "aws_internet_gateway" "igw_b" {
  provider = aws.cuenta_b
  vpc_id   = aws_vpc.vpc_b.id

  tags = {
    Name = "CuentaB-IGW"
  }
}

resource "aws_route_table" "rt_b" {
  provider = aws.cuenta_b
  vpc_id   = aws_vpc.vpc_b.id

  tags = {
    Name = "CuentaB-Public-RT"
  }
}

resource "aws_route" "rt_b_igw" {
  provider               = aws.cuenta_b
  route_table_id         = aws_route_table.rt_b.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw_b.id
}

resource "aws_route_table_association" "rta_b" {
  provider       = aws.cuenta_b
  subnet_id      = aws_subnet.subnet_b.id
  route_table_id = aws_route_table.rt_b.id
}

# --- 2. VPC Peering Connection ---

# Requester (Cuenta A)
resource "aws_vpc_peering_connection" "peer" {
  vpc_id        = data.aws_vpc.cuenta_a.id
  peer_vpc_id   = aws_vpc.vpc_b.id
  peer_owner_id = data.aws_caller_identity.cuenta_b.account_id
  peer_region   = var.aws_region
  auto_accept   = false # Cross-account must be accepted by Accepter

  tags = {
    Name = "Peering-CuentaA-CuentaB"
  }
}

# Accepter (Cuenta B)
resource "aws_vpc_peering_connection_accepter" "peer_accepter" {
  provider                  = aws.cuenta_b
  vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
  auto_accept               = true

  tags = {
    Name = "Peering-CuentaA-CuentaB-Accepter"
  }
}

# --- 3. Routing ---

# Route from Cuenta A -> Cuenta B
resource "aws_route" "route_a_to_b" {
  route_table_id            = data.aws_vpc.cuenta_a.main_route_table_id
  destination_cidr_block    = aws_vpc.vpc_b.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
}

# Route from Cuenta B -> Cuenta A
resource "aws_route" "route_b_to_a" {
  provider                  = aws.cuenta_b
  route_table_id            = aws_route_table.rt_b.id
  destination_cidr_block    = data.aws_vpc.cuenta_a.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
}
