# ==============================================================================
# QA Environment - Outputs
# ==============================================================================

output "auth_public_ip" {
  description = "The Elastic Public IP address of the Auth Service"
  value       = aws_eip.auth_eip.public_ip
}

output "catalog_public_ip" {
  description = "The Elastic Public IP address of the Catalog Service"
  value       = aws_eip.catalog_eip.public_ip
}

output "frontend_public_ip" {
  description = "The Elastic Public IP address of the Frontend Service"
  value       = aws_eip.frontend_eip.public_ip
}
