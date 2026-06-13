# ==============================================================================
# Production Environment - Elastic IPs
# ==============================================================================

resource "aws_eip" "api_gateway_eip" {
  instance = aws_instance.api_gateway_server.id
  domain   = "vpc"

  tags = {
    Name        = "${var.environment}-api-gateway-eip"
    Environment = upper(var.environment)
  }
}
