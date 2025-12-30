# Repository Structure

This repository follows a self-contained application structure where each application includes all its code, deployment configurations, and Docker files in one place.

## Directory Layout

```
viaroute/
├── apps/                          # Applications directory
│   ├── demo-app/                  # Example demo application
│   │   └── k8s/                  # Kubernetes manifests
│   └── viaroute-app/             # Main multi-tenant application
│       ├── backend/              # NestJS backend
│       │   ├── src/              # Source code
│       │   ├── package.json
│       │   └── tsconfig.json
│       ├── frontend/             # React frontend
│       │   ├── src/              # Source code
│       │   ├── package.json
│       │   └── vite.config.ts
│       ├── shared/                # Shared types and utilities
│       ├── helm/                  # Helm chart
│       │   ├── Chart.yaml
│       │   ├── values.yaml
│       │   └── templates/        # Helm templates
│       ├── k8s/                   # Kubernetes manifests (for ArgoCD)
│       │   ├── deployment.yaml
│       │   ├── service.yaml
│       │   ├── application.yaml  # ArgoCD Application
│       │   └── kustomization.yaml
│       ├── Dockerfile            # Container build definition
│       ├── docker-compose.yml    # Local development
│       └── README.md             # App-specific documentation
├── infra/                         # Infrastructure as Code
│   └── poc/                      # Proof of Concept infrastructure
│       ├── applications.tf      # ArgoCD Applications
│       ├── argocd.tf            # ArgoCD setup
│       └── kubernetes.tf        # Kubernetes cluster
├── .github/                       # CI/CD
│   └── workflows/
│       └── ci-cd.yml            # GitHub Actions pipeline
└── README.md                      # Main documentation
```

## Design Principles

1. **Self-Contained Applications**: Each app in `apps/` contains all its code, deployment configs, and Docker files
2. **Separation of Concerns**: Infrastructure code is separate from application code
3. **Deployment Flexibility**: Apps can be deployed via Helm, Kustomize, or kubectl
4. **Clear Ownership**: Each app owns its entire lifecycle

## Benefits

- **Maintainability**: All related files for an app are in one place
- **Scalability**: Easy to add new applications without cluttering the root
- **Clarity**: Clear separation between apps and infrastructure
- **Portability**: Apps can be easily moved or extracted

## Adding a New Application

1. Create a new directory under `apps/`
2. Include:
   - Application code (backend/frontend)
   - `helm/` directory for Helm chart
   - `k8s/` directory for Kubernetes manifests
   - `Dockerfile` and `docker-compose.yml`
   - `README.md` with app-specific docs
3. Update `infra/poc/applications.tf` to add ArgoCD Application
4. Update CI/CD pipeline if needed

