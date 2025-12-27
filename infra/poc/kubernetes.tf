module "kubernetes" {
  source  = "hcloud-k8s/kubernetes/hcloud"
  version = "3.16.1"

  cluster_name = "k8s-poc"
  hcloud_token = var.hcloud_token

  # Export configs for talosctl and kubectl (optional)
  cluster_kubeconfig_path  = "kubeconfig"
  cluster_talosconfig_path = "talosconfig"

  # Enable Cilium Gateway API and Cert Manager (optional)
  cert_manager_enabled       = true
  cilium_gateway_api_enabled = true

  control_plane_nodepools = [
    { name = "control", type = "cpx22", location = "fsn1", count = 3 }
  ]
  worker_nodepools = [
    { name = "worker", type = "cpx22", location = "fsn1", count = 3 }
  ]
}