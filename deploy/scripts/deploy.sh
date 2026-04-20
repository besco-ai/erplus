#!/usr/bin/env bash
# Atualiza o ERPlus em produção para a :latest publicada no GHCR.
# Roda na VPS, como root, a qualquer momento.

set -euo pipefail
cd /opt/erplus

echo "==> Pull das imagens mais recentes..."
docker compose pull

echo "==> Aplicando nova versão..."
docker compose up -d

echo "==> Removendo imagens antigas órfãs..."
docker image prune -f

echo "==> Status:"
docker compose ps
