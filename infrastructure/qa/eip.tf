# ==============================================================================
# QA Environment - Elastic IPs
# ==============================================================================

resource "aws_eip" "auth_eip" {
  instance = aws_instance.auth_server.id
  domain   = "vpc"

  tags = {
    Name        = "${var.environment}-auth-service-eip"
    Environment = upper(var.environment)
  }
}

resource "aws_eip" "catalog_eip" {
  instance = aws_instance.catalog_server.id
  domain   = "vpc"

  tags = {
    Name        = "${var.environment}-catalog-service-eip"
    Environment = upper(var.environment)
  }
}

resource "aws_eip" "frontend_eip" {
  instance = aws_instance.frontend_server.id
  domain   = "vpc"

  tags = {
    Name        = "${var.environment}-frontend-service-eip"
    Environment = upper(var.environment)
  }
}
