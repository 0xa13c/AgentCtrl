#!/usr/bin/env bash
# One-shot deploy script for AgentCtrl on a fresh Oracle Cloud Infrastructure VM.
# Run this ON the VPS (Ubuntu/Oracle Linux) after cloning the repo.
#
# Usage:
#   ./deploy/deploy.sh                 # also opens 80/443 (public Nginx path)
#   ./deploy/deploy.sh --no-firewall   # skip firewall changes (Tailscale/Cloudflare Tunnel path)
set -euo pipefail

OPEN_FIREWALL=1
for arg in "$@"; do
  if [ "$arg" = "--no-firewall" ]; then
    OPEN_FIREWALL=0
  fi
done

echo "==> Installing Docker + Compose plugin (skip if already installed)"
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
fi

if [ "$OPEN_FIREWALL" -eq 1 ]; then
  echo "==> Opening 80/443 via the OS firewall (iptables/firewalld/ufw)"
  sudo firewall-cmd --permanent --add-port=80/tcp  2>/dev/null || sudo ufw allow 80/tcp  || true
  sudo firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || sudo ufw allow 443/tcp || true
  sudo firewall-cmd --reload 2>/dev/null || true
else
  echo "==> Skipping firewall changes (--no-firewall) — recommended if you're using"
  echo "    Tailscale Serve or a Cloudflare Tunnel, since neither needs an open inbound port."
fi

echo "==> Building and starting containers (app + Redis)"
docker compose pull --ignore-pull-failures || true
docker compose up -d --build

echo "==> Done. App is listening on 127.0.0.1:3000 inside the host."
echo "    See DEPLOY.md for the three access options (Tailscale Serve / Cloudflare Tunnel / public Nginx)."

if [ "$OPEN_FIREWALL" -eq 1 ]; then
  echo ""
  echo "NOTE — Oracle Cloud specific step:"
  echo "  OCI security lists/NSGs block traffic by default even if the OS firewall allows it."
  echo "  In the OCI Console: your VCN -> Security Lists -> Add Ingress Rule for 80/tcp and 443/tcp"
  echo "  (source CIDR 0.0.0.0/0, or lock down to your IP)."
fi
