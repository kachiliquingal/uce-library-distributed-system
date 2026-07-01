resource "aws_security_group" "peering_sg_b" {
  provider    = aws.cuenta_b
  name        = "Peering-SG-CuentaB-Prod"
  description = "Permitir trafico desde Cuenta A en Prod"
  vpc_id      = aws_vpc.vpc_b.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [data.aws_vpc.cuenta_a.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "CuentaB-Peering-SG-Prod"
  }
}
