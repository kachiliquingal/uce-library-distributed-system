# ==============================================================================
# Production Environment - Outputs
# ==============================================================================

output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "auth_public_ip" {
  description = "The ALB DNS name (auth service is behind the ALB in production)"
  value       = aws_lb.main.dns_name
}

output "catalog_public_ip" {
  description = "The ALB DNS name (catalog service is behind the ALB in production)"
  value       = aws_lb.main.dns_name
}

output "frontend_public_ip" {
  description = "The ALB DNS name (frontend is behind the ALB in production)"
  value       = aws_lb.main.dns_name
}
