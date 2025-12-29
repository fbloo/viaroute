# ArgoCD Application for demo-app
resource "kubernetes_manifest" "demo_app" {
  depends_on = [helm_release.argocd]

  manifest = {
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "Application"
    metadata = {
      name      = "demo-app"
      namespace = "argocd"
      labels = {
        "app.kubernetes.io/name" = "demo-app"
      }
    }
    spec = {
      project = "default"
      source = {
        repoURL        = "https://github.com/fbloo/viaroute.git"
        targetRevision = "main"
        path           = "apps/demo-app"
      }
      destination = {
        server    = "https://kubernetes.default.svc"
        namespace = "demo"
      }
      syncPolicy = {
        automated = {
          prune    = true
          selfHeal = true
        }
        syncOptions = ["CreateNamespace=true"]
      }
    }
  }
}

# Create demo namespace for the application
resource "kubernetes_namespace" "demo" {
  depends_on = [null_resource.verify_cluster_ready]

  metadata {
    name = "demo"
    labels = {
      "app.kubernetes.io/name" = "demo"
    }
  }
}

