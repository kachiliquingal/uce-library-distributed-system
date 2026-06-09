# UCE Library Distributed System

<p align="center">
  A highly scalable, distributed library management system built with microservices architecture, automated CI/CD pipelines, and Infrastructure as Code.
</p>

## 🚀 Overview

The UCE Library Distributed System is an enterprise-grade application designed to handle library operations. It leverages a modern tech stack to ensure high availability, fault tolerance, and independent scalability of its core domains.

## 🏗️ Architecture

The system follows a strict **Hexagonal Architecture** (Ports and Adapters) pattern across its microservices, ensuring that business logic is decoupled from external dependencies.

- **Frontend Application:** A React SPA built with Vite and styled with TailwindCSS. Acts as the primary API consumer.
- **Auth Service:** Node.js/Express service handling authentication, JWT generation, and user management using **PostgreSQL** and **Redis**.
- **Catalog Service:** Node.js/Express service managing the bibliographic inventory, operating independently with its own **MongoDB** database (Database-per-service pattern).

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, TailwindCSS, Zustand, Axios
- **Backend:** Node.js, Express, TypeScript, Zod, JWT
- **Databases:** PostgreSQL (Relational), MongoDB (NoSQL), Redis (Cache/Sessions)
- **Infrastructure:** AWS (EC2, VPC, Security Groups, Elastic IPs), Docker, Docker Compose
- **IaC & Automation:** Terraform, GitHub Actions, Turborepo (Monorepo management)

## 🔄 CI/CD Pipeline

The project features a state-of-the-art continuous integration and deployment pipeline using GitHub Actions:

1. **Continuous Integration (`ci.yml`):**
   - Triggered on PRs.
   - Runs Turborepo to execute distributed builds, ESLint checks, and Unit Tests.
   - Validates Dockerfile compilation for all services.
2. **Infrastructure Deployment (`deploy-infra.yml`):**
   - Triggered on pushes to specific branches.
   - Uses Terraform with a dynamic S3 backend state to provision immutable AWS EC2 instances and Security Groups.
3. **Application Deployment (`cd-apps.yml`):**
   - Builds backend Docker images and pushes them to DockerHub.
   - Extracts real-time dynamic IPs from the Terraform state to inject into the frontend build.
   - Builds and pushes the frontend image. Watchtower automatically updates the running containers on the AWS instances.

## 💻 Getting Started (Local Development)

### Prerequisites
- Node.js 20+
- npm (Node Package Manager)
- Docker Desktop (for running databases locally)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kachiliquingal/uce-library-distributed-system.git
   cd uce-library-distributed-system
   ```

2. **Install dependencies (from the root):**
   ```bash
   npm install
   ```

3. **Start local databases:**
   Ensure you have a local PostgreSQL, Redis, and MongoDB running, or use docker-compose:
   ```bash
   docker-compose -f deploy/docker-compose.db.yml up -d
   ```

4. **Run the development servers (Turborepo):**
   ```bash
   npm run dev
   ```
   This will simultaneously start the Frontend, Auth Service, and Catalog Service in development mode.