# ViaRoute - Multi-Tenant Full-Stack Application

A complete full-stack multi-tenant web application built with React, NestJS, PostgreSQL, and deployed on Kubernetes with ArgoCD.

## Architecture

- **Frontend**: React 18+ with TypeScript, built with Vite
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with Kysely query builder
- **Authentication**: Auth0 integration
- **Deployment**: Single Dockerfile, Helm charts, ArgoCD

## Features

- Multi-tenant support with tenant isolation
- CRUD operations for Tenants, Users, and Plans
- Auth0 authentication and authorization
- Type-safe database queries with Kysely
- Kubernetes-ready with Helm charts
- CI/CD pipeline with GitHub Actions

## Project Structure

```
viaroute/
├── src/
│   ├── backend/          # NestJS backend application
│   ├── frontend/         # React frontend application
│   └── shared/           # Shared types and utilities
├── apps/
│   └── viaroute-app/     # Kubernetes manifests for ArgoCD
├── helm/
│   └── viaroute-app/     # Helm chart for deployment
├── infra/
│   └── poc/              # Terraform infrastructure
└── .github/
    └── workflows/        # CI/CD pipelines
```

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker Compose)
- Auth0 account (optional, can use JWT_SECRET for development)
- Kubernetes cluster (for deployment)
- Helm 3.x (for deployment)
- kubectl configured (for deployment)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/fbloo/viaroute.git
cd viaroute
```

### 2. Environment Configuration

Navigate to the app directory:

```bash
cd apps/viaroute-app
```

**Backend environment:**

```bash
cd backend
cp .env.example .env
# Edit .env with database and Auth0 settings
```

**Frontend environment:**

```bash
cd ../frontend
cp .env.example .env.local
# Edit .env.local with Auth0 configuration:
# VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
# VITE_AUTH0_CLIENT_ID=your-auth0-client-id
# VITE_AUTH0_AUDIENCE=https://your-api-audience
# VITE_API_URL=http://localhost:3000/api
```

### 3. Database Setup

#### Option A: Using Docker Compose

```bash
docker-compose up -d postgres
```

Wait for PostgreSQL to be ready, then run migrations:

```bash
# Connect to the database and run the migration
cd apps/viaroute-app
docker-compose exec postgres psql -U postgres -d viaroute -f /path/to/migration.sql

# Or manually copy the migration file
cat backend/src/database/migrations/001_initial_schema.sql | \
  docker-compose exec -T postgres psql -U postgres -d viaroute
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create database: `createdb viaroute`
3. Run migration: `psql viaroute < apps/viaroute-app/backend/src/database/migrations/001_initial_schema.sql`

### 4. Install Dependencies

```bash
# Backend
cd src/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Run the Application

#### Development Mode (Separate Processes)

**Terminal 1 - Backend:**
```bash
cd apps/viaroute-app/backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/viaroute-app/frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Health Check: http://localhost:3000/health

#### Using Docker Compose

```bash
cd apps/viaroute-app
docker-compose up
```

This will start both PostgreSQL and the backend. The frontend can still run separately in development mode.

## Auth0 Configuration

### 1. Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Create a new Application (Single Page Application)
3. Note your Domain, Client ID, and configure allowed callback URLs

### 2. Configure API

1. Create a new API in Auth0
2. Set the Identifier (this is your Audience)
3. Enable RBAC if needed

### 3. Add Custom Claims (Optional)

To include tenant_id in JWT tokens, create a Rule in Auth0:

```javascript
function addTenantId(user, context, callback) {
  // Add tenant_id to the token
  context.idToken['https://your-domain.com/tenant_id'] = user.user_metadata.tenant_id;
  context.accessToken['https://your-domain.com/tenant_id'] = user.user_metadata.tenant_id;
  callback(null, user, context);
}
```

### 4. Environment Variables

Set these in your `.env`:
- `AUTH0_DOMAIN`: Your Auth0 domain
- `AUTH0_AUDIENCE`: Your API identifier

## Building for Production

### Build Frontend and Backend

```bash
# Build frontend
cd apps/viaroute-app/frontend
npm run build

# Build backend
cd ../backend
npm run build
```

### Docker Build

```bash
# From repository root
docker build -f apps/viaroute-app/Dockerfile -t viaroute-app:latest .
```

### Test Docker Image

```bash
docker run -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_NAME=viaroute \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  viaroute-app:latest
```

## Kubernetes Deployment

### 1. Prepare Secrets

Create Kubernetes secrets for database and Auth0:

```bash
kubectl create namespace viaroute

# Database secret
kubectl create secret generic viaroute-app-secrets \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASSWORD=your-password \
  --from-literal=AUTH0_DOMAIN=your-domain.auth0.com \
  --from-literal=AUTH0_AUDIENCE=https://your-api-audience \
  --from-literal=JWT_SECRET=your-secret-key \
  -n viaroute

# ConfigMap (optional, can use Helm values)
kubectl create configmap viaroute-app-config \
  --from-literal=DB_HOST=postgresql \
  --from-literal=DB_PORT=5432 \
  --from-literal=DB_NAME=viaroute \
  -n viaroute
```

### 2. Deploy with Helm

```bash
# Add Bitnami repo for PostgreSQL
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install PostgreSQL (if not using external database)
helm install postgresql bitnami/postgresql \
  --namespace viaroute \
  --set auth.postgresPassword=your-password \
  --set auth.database=viaroute

# Install application
helm install viaroute-app ./apps/viaroute-app/helm \
  --namespace viaroute \
  --set image.repository=your-registry/viaroute-app \
  --set image.tag=latest \
  --set postgresql.enabled=false \
  --set database.host=postgresql
```

### 3. Deploy with Kustomize (for ArgoCD)

The application is configured for ArgoCD sync from the `apps/viaroute-app/k8s/` directory.

Update the image in `apps/viaroute-app/k8s/deployment.yaml` to point to your container registry.

## ArgoCD Integration

The application is already configured in Terraform (`infra/poc/applications.tf`). ArgoCD will:

1. Monitor the Git repository
2. Sync changes automatically
3. Create the namespace if it doesn't exist
4. Deploy the application

### Deployment Integration with Terraform/ArgoCD

The application is fully integrated with the existing Terraform and ArgoCD setup:

1. **Terraform** (`infra/poc/applications.tf`):
   - Creates the `viaroute` namespace
   - Creates the ArgoCD Application resource
   - Configures automatic sync and self-healing

2. **ArgoCD** (`apps/viaroute-app/application.yaml`):
   - Monitors the Git repository at `apps/viaroute-app/`
   - Syncs Kubernetes manifests (deployment, service)
   - Creates namespace automatically if missing

3. **Deployment Options**:
   - **Via ArgoCD**: Automatic sync from Git (recommended)
   - **Via Helm**: `helm install viaroute-app ./helm/viaroute-app`
   - **Via kubectl**: `kubectl apply -f apps/viaroute-app/`

### Manual ArgoCD Setup

If not using Terraform, create the ArgoCD Application:

```bash
kubectl apply -f apps/viaroute-app/k8s/application.yaml
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) includes:

1. **Test**: Run backend tests and frontend linting
2. **Build**: Build and push Docker image to GitHub Container Registry
3. **Deploy**: Deploy to Kubernetes using Helm

### Required GitHub Secrets

- `KUBECONFIG`: Base64-encoded kubeconfig file
- `DB_PASSWORD`: Database password
- `AUTH0_DOMAIN`: Auth0 domain
- `AUTH0_AUDIENCE`: Auth0 API audience
- `JWT_SECRET`: JWT secret key

### Workflow Triggers

- Push to `main` branch: Build and deploy
- Pull requests: Build and test only

## Database Migrations

Migrations are SQL files in `src/backend/src/database/migrations/`. To run manually:

```bash
# Using psql
psql -h localhost -U postgres -d viaroute -f apps/viaroute-app/backend/src/database/migrations/001_initial_schema.sql

# Or using Docker
cd apps/viaroute-app
docker-compose exec postgres psql -U postgres -d viaroute -f /path/to/migration.sql
```

For production, consider using a migration tool or Kubernetes Job.

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Tenants
- `GET /api/tenants` - List all tenants
- `GET /api/tenants/:id` - Get tenant by ID
- `POST /api/tenants` - Create tenant
- `PATCH /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Users
- `GET /api/users` - List users (tenant-scoped)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Plans
- `GET /api/plans` - List plans (tenant-scoped)
- `GET /api/plans/:id` - Get plan by ID
- `POST /api/plans` - Create plan
- `PATCH /api/plans/:id` - Update plan
- `DELETE /api/plans/:id` - Delete plan

All endpoints require authentication via Bearer token (JWT).

## Multi-Tenancy

The application implements multi-tenancy through:

1. **Tenant ID Extraction**: From JWT token (custom claim) or `X-Tenant-ID` header
2. **Row-Level Isolation**: All queries filter by `tenant_id`
3. **Middleware**: `TenantMiddleware` extracts and validates tenant context

### Adding Tenant Context

In Auth0, add a custom claim for `tenant_id`:
- Namespace: `https://your-domain.com/tenant_id`
- Value: The tenant UUID

Or pass `X-Tenant-ID` header with requests (for development).

## Troubleshooting

### Database Connection Issues

- Check PostgreSQL is running: `docker-compose ps`
- Verify connection string in `.env`
- Check network connectivity

### Auth0 Issues

- Verify domain, client ID, and audience are correct
- Check Auth0 logs in dashboard
- Ensure callback URLs are configured
- For development, you can use `JWT_SECRET` instead

### Kubernetes Deployment Issues

- Check pod logs: `kubectl logs -n viaroute deployment/viaroute-app`
- Verify secrets exist: `kubectl get secrets -n viaroute`
- Check ConfigMap: `kubectl get configmap -n viaroute`
- Verify database connectivity from pod

### ArgoCD Sync Issues

- Check ArgoCD application status: `kubectl get application -n argocd`
- View sync logs in ArgoCD UI
- Verify Git repository access
- Check namespace exists: `kubectl get namespace viaroute`

## Development Tips

1. **Hot Reload**: Both frontend (Vite) and backend (NestJS) support hot reload in development
2. **Type Safety**: Use shared types from `src/shared/types/` for consistency
3. **Database Queries**: Use Kysely's type-safe queries - types are generated from schema
4. **Testing**: Add tests in `src/backend/src/**/*.spec.ts`

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

