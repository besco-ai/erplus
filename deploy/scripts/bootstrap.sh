#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  ERPlus — VPS bootstrap (Ubuntu 24.04 LTS)
# ═══════════════════════════════════════════════════════════════════
#
# Roda UMA ÚNICA VEZ depois de criar a VPS. Deixa a máquina pronta pra
# deploy: atualiza pacotes, instala Docker, configura firewall, cria a
# estrutura em /opt/erplus e gera um .env com secrets aleatórios fortes.
#
# Uso (como root na VPS):
#   curl -fsSL https://raw.githubusercontent.com/besco-ai/erplus/main/deploy/scripts/bootstrap.sh | bash
#
# Ou, se estiver com o repo clonado:
#   bash /path/to/repo/deploy/scripts/bootstrap.sh

set -euo pipefail

# ── Parâmetros ──
DOMAIN="${DOMAIN:-erplus.besco.ai}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-admin@besco.ai}"
APP_DIR="/opt/erplus"

log() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31merro:\033[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "rode como root (use sudo)"

# ── 1. Atualizar sistema ──
log "Atualizando pacotes do sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get -yq upgrade
apt-get -yq install ca-certificates curl gnupg ufw openssl

# ── 2. Instalar Docker Engine + Compose plugin ──
if ! command -v docker &>/dev/null; then
  log "Instalando Docker Engine..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get -yq install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
else
  log "Docker já instalado, pulando."
fi

# ── 3. Firewall ──
log "Configurando firewall (ufw)..."
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22/tcp  comment 'SSH'          >/dev/null
ufw allow 80/tcp  comment 'HTTP'         >/dev/null
ufw allow 443/tcp comment 'HTTPS'        >/dev/null
ufw --force enable >/dev/null
log "Firewall: apenas 22, 80 e 443 abertos."

# ── 4. Estrutura /opt/erplus ──
log "Criando ${APP_DIR}..."
mkdir -p "${APP_DIR}/backups"
chmod 700 "${APP_DIR}/backups"

# ── 5. Gerar .env se não existir ──
if [[ ! -f "${APP_DIR}/.env" ]]; then
  log "Gerando ${APP_DIR}/.env com secrets aleatórios..."
  DB_PASS="$(openssl rand -base64 36 | tr -dc 'A-Za-z0-9' | head -c 40)"
  JWT_KEY="$(openssl rand -base64 72 | tr -dc 'A-Za-z0-9' | head -c 72)"

  cat > "${APP_DIR}/.env" <<EOF
DOMAIN=${DOMAIN}
LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL}

POSTGRES_DB=erplus
POSTGRES_USER=erplus
POSTGRES_PASSWORD=${DB_PASS}

JWT_SECRET_KEY=${JWT_KEY}
JWT_ISSUER=ERPlus
JWT_AUDIENCE=ERPlus

CLIENT_URL=https://${DOMAIN}

ASPNETCORE_ENVIRONMENT=Production
EOF
  chmod 600 "${APP_DIR}/.env"
  log ".env criado (POSTGRES_PASSWORD e JWT_SECRET_KEY únicos). Guarde cópia segura."
else
  log ".env já existe, preservando."
fi

# ── 6. Baixar docker-compose.prod.yml e Caddyfile ──
log "Copiando docker-compose.prod.yml e Caddyfile para ${APP_DIR}..."
RAW_BASE="https://raw.githubusercontent.com/besco-ai/erplus/main/deploy"
curl -fsSL "${RAW_BASE}/docker-compose.prod.yml" -o "${APP_DIR}/docker-compose.yml"
curl -fsSL "${RAW_BASE}/Caddyfile"               -o "${APP_DIR}/Caddyfile"

# ── 7. Habilitar swap de 2GB (ajuda o Postgres na KVM 2) ──
if [[ ! -f /swapfile ]]; then
  log "Criando swap de 2GB (proteção contra picos de memória)..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── 8. Cron de backup diário às 3h ──
log "Agendando backup diário (03:00 UTC)..."
curl -fsSL "${RAW_BASE}/scripts/backup.sh" -o /usr/local/bin/erplus-backup
chmod +x /usr/local/bin/erplus-backup
cat > /etc/cron.d/erplus-backup <<'EOF'
0 3 * * * root /usr/local/bin/erplus-backup >> /var/log/erplus-backup.log 2>&1
EOF

# ── 9. Resumo ──
log "Bootstrap concluído."
cat <<EOF

Próximos passos:
  cd ${APP_DIR}
  docker compose pull
  docker compose up -d
  docker compose logs -f api

O domínio ${DOMAIN} precisa já estar apontando para este servidor
(um registro A para o IP público da VPS). Quando subir, o Caddy negocia
o certificado Let's Encrypt automaticamente nos primeiros segundos.

Acesse: https://${DOMAIN}
EOF
