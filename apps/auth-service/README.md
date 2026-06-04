# Auth Service

## Overview
Authentication and identity management microservice for the UCE Library Distributed System. Built with Node.js, TypeScript, and Hexagonal Architecture.

## Responsibilities
- User registration and management.
- Credential validation and password hashing.
- JWT issuance for system-wide authorization.

## Infrastructure
- **Primary Database:** PostgreSQL
- **Cache & Sessions:** Redis
- **Port:** 3001

## Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`