# Catalog Service

## Overview
Catalog and inventory management microservice for the UCE Library Distributed System. Built with Node.js, TypeScript, and Hexagonal Architecture.

## Responsibilities
- Full CRUD lifecycle management for bibliographic resources.
- Independent operation from the Auth Service (Database-per-service pattern).

## Infrastructure
- **Primary Database:** MongoDB
- **Port:** 3002

## Endpoints
- `POST /api/catalog/books`
- `GET /api/catalog/books`
- `PUT /api/catalog/books/:id`
- `DELETE /api/catalog/books/:id`