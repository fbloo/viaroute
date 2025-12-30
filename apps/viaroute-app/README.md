# ViaRoute App

Self-contained multi-tenant application with backend, frontend, and deployment configurations.

## Structure

```
viaroute-app/
├── backend/          # NestJS backend application
├── frontend/         # React frontend application
├── shared/            # Shared types and utilities
├── helm/              # Helm chart for Kubernetes deployment
├── k8s/               # Kubernetes manifests (for ArgoCD)
├── Dockerfile         # Container build definition
└── docker-compose.yml # Local development setup
```

## Local Development

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker Compose)

### Quick Start

1. **Environment Setup**

   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your configuration

   # Frontend
   cd ../frontend
   cp .env.example .env.local
   # Edit .env.local with Auth0 configuration
   ```

2. **Install Dependencies**

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Run with Docker Compose**

   ```bash
   # From the app root
   docker-compose up
   ```

   Or run separately:

   ```bash
   # Terminal 1: Backend
   cd backend
   npm run start:dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

## Development Tools

### Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Check code quality (lint + format)
npm run check

# Auto-fix issues
npm run check:fix

# Format only
npm run format

# Lint only
npm run lint
```

### Testing

This project uses [Vitest](https://vitest.dev/) for testing:

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# Coverage
npm run test:cov
```

## Building

### Docker Build

```bash
# From repository root
docker build -f apps/viaroute-app/Dockerfile -t viaroute-app:latest .
```

## Deployment

### Helm

```bash
helm install viaroute-app ./apps/viaroute-app/helm \
  --namespace viaroute \
  --create-namespace
```

### Kubernetes (ArgoCD)

The application is configured for ArgoCD sync from `apps/viaroute-app/k8s/`.

## Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories.
