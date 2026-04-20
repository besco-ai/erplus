#!/usr/bin/env bash
# Dump completo do Postgres, com retenção de 14 dias.
# Roda diariamente via /etc/cron.d/erplus-backup (configurado no bootstrap).

set -euo pipefail
cd /opt/erplus

# Usa usuário/senha do .env
set -a; source .env; set +a

TS="$(date -u +%Y%m%d_%H%M%S)"
OUT="backups/erplus_${TS}.sql.gz"

docker compose exec -T db \
  pg_dumpall -U "${POSTGRES_USER}" \
  | gzip -9 > "${OUT}"

# Retém 14 dias de backups
find backups -name 'erplus_*.sql.gz' -mtime +14 -delete

# Saída para logs
SIZE="$(du -h "${OUT}" | cut -f1)"
echo "[$(date -u +%FT%TZ)] backup ok: ${OUT} (${SIZE})"
