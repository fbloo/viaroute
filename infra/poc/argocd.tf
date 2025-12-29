provider "kubernetes" {
  # The kubeconfig will be created by the kubernetes module
  config_path = "${abspath(path.module)}/kubeconfig"
}

provider "helm" {
  kubernetes = {
    config_path = "${abspath(path.module)}/kubeconfig"
  }
}

# Wait for cluster to be ready after creation
resource "time_sleep" "wait_for_cluster" {
  depends_on = [module.kubernetes]

  create_duration = "60s"
}

# Verify cluster is ready by checking API server
resource "null_resource" "verify_cluster_ready" {
  depends_on = [
    time_sleep.wait_for_cluster,
    module.kubernetes
  ]

  provisioner "local-exec" {
    command = <<-EOT
      KUBECONFIG_FILE="${abspath(path.module)}/kubeconfig"
      export KUBECONFIG="$KUBECONFIG_FILE"
      
      if [ ! -f "$KUBECONFIG_FILE" ]; then
        echo "Error: kubeconfig file not found at $KUBECONFIG_FILE"
        exit 1
      fi
      
      echo "Using kubeconfig: $KUBECONFIG_FILE"
      max_attempts=30
      attempt=0
      
      until kubectl --kubeconfig="$KUBECONFIG_FILE" cluster-info >/dev/null 2>&1; do
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
          echo "Error: Cluster not ready after $max_attempts attempts"
          echo "Last kubectl error:"
          kubectl --kubeconfig="$KUBECONFIG_FILE" cluster-info 2>&1 || true
          exit 1
        fi
        echo "Waiting for cluster to be ready (attempt $attempt/$max_attempts)..."
        sleep 10
      done
      
      echo "Cluster API is reachable. Verifying nodes are ready..."
      node_ready_count=0
      max_node_wait=20
      node_wait=0
      while [ $node_wait -lt $max_node_wait ]; do
        ready_nodes=$(kubectl --kubeconfig="$KUBECONFIG_FILE" get nodes --no-headers 2>/dev/null | grep -c " Ready " || echo "0")
        if [ "$ready_nodes" -gt "0" ]; then
          echo "Found $ready_nodes ready node(s)"
          break
        fi
        node_wait=$((node_wait + 1))
        echo "Waiting for nodes to be ready ($node_wait/$max_node_wait)..."
        sleep 5
      done
      kubectl --kubeconfig="$KUBECONFIG_FILE" get nodes 2>&1 || echo "Warning: Could not list nodes"
      echo "Cluster is ready!"
    EOT
    interpreter = ["/bin/bash", "-c"]
  }

  triggers = {
    always_run = timestamp()
    kubeconfig = fileexists("${path.module}/kubeconfig") ? filebase64sha256("${path.module}/kubeconfig") : ""
  }

}

resource "kubernetes_namespace" "argocd" {
  depends_on = [null_resource.verify_cluster_ready]
  metadata {
    name = "argocd"
  }

}

resource "helm_release" "argocd" {
  name       = "argocd"
  namespace  = kubernetes_namespace.argocd.metadata[0].name
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = "6.7.18" # pin this

  atomic           = false # don't rollback on failure, so we can see the error

  values = fileexists("${path.module}/argocd-values.yaml") ? [
    file("${path.module}/argocd-values.yaml")
  ] : []

  depends_on = [
    kubernetes_namespace.argocd,
    null_resource.verify_cluster_ready
  ]
}
