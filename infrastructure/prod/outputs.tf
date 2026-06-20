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

output "brokers_private_ip" {
  description = "The private IP address of the Brokers Server (Kafka/RabbitMQ)"
  value       = aws_instance.brokers_server.private_ip
}

output "brokers_public_ip" {
  description = "The public IP address of the Brokers Server (useful for debugging, though internal comms use private IP)"
  value       = aws_instance.brokers_server.public_ip
}

output "database_private_ip" {
  description = "The private IP address of the Database Server"
  value       = aws_instance.database_server.private_ip
}

output "database_public_ip" {
  description = "The public IP address of the Database Server"
  value       = aws_instance.database_server.public_ip
}
