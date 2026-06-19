# ==============================================================================
# QA Environment - Outputs
# ==============================================================================

output "api_gateway_public_ip" {
  description = "The public Elastic IP of the API Gateway / Bastion Host"
  value       = aws_eip.api_gateway_eip.public_ip
}

output "brokers_private_ip" {
  description = "The private IP of the Brokers (Kafka, RabbitMQ, MQTT) Server"
  value       = aws_instance.brokers_server.private_ip
}

output "brokers_public_ip" {
  description = "The public IP of the Brokers (Kafka, RabbitMQ, MQTT) Server"
  value       = aws_instance.brokers_server.public_ip
}

output "database_private_ip" {
  description = "The private IP of the Database Server"
  value       = aws_instance.database_server.private_ip
}

output "database_public_ip" {
  description = "The public IP of the Database Server"
  value       = aws_instance.database_server.public_ip
}
