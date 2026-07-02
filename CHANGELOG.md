# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-07-01

### Added
- **Search Service (MS-10)**: New microservice based on Elasticsearch for ultra-fast full-text searches.
- **VPC Peering**: Implemented inter-VPC routing between Account A (Core Services) and Account B (Search Service) for production and QA environments.
- **Frontend Integration**: Implemented search bar with real-time dropdown suggestions using the new search microservice.
- **Kafka Integration**: Catalog Service now publishes domain events to Kafka which are consumed by Search Service to keep the Elasticsearch index in sync.
- **Data Hydration**: Implemented a synchronization use-case to hydrate 5000+ historical books from MongoDB into Elasticsearch without downtime.

### Fixed
- Fixed API Gateway routing issues to appropriately target internal services.
- Resolved ALB Security Group rules to allow inter-account cross-VPC API communication.

### Security
- Created explicit restrictive Security Groups (`CuentaB-Peering-SG`) limiting peering traffic to internal trusted IPs only.
