# ==============================================================================
# Production Environment - Outputs
# ==============================================================================

output "api_gateway_public_ip" {
  description = "The Elastic Public IP address of the API Gateway / Bastion. Give this to the engineer."
  value       = aws_eip.api_gateway_eip.public_ip
}

output "internal_alb_dns_name" {
  description = "The internal DNS name of the ALB (for debugging purposes)"
  value       = aws_lb.main.dns_name
}
