# Deploy em produção

Stack de deploy do ERPlus em uma VPS única com Docker. Usa as imagens
publicadas em `ghcr.io/besco-ai/erplus-*` quando uma tag `v*` é criada.

## Arquitetura

```
Internet
  │  HTTPS 443 / HTTP 80
  ▼
┌──────────────────────────────────────┐
│ VPS Ubuntu 24.04                     │
│                                      │
│ ┌──────────┐                         │
│ │  Caddy   │  reverse proxy + TLS    │
│ │ :80 :443 │  Let's Encrypt auto     │
│ └────┬─────┘                         │
│      │                               │
│ ┌────┴────┬─────────┬───────┐        │
│ ▼         ▼         ▼                │
│ api     client    postgres           │
│ :8080   :80       :5432              │
│                                      │
└──────────────────────────────────────┘
```

- **Caddy** é o único componente com portas abertas pra internet.
- **Postgres** nunca é exposto — vive só dentro da rede Docker.
- **API** e **Client** também ficam internos — chegam na internet só via
  Caddy, que faz o roteamento (`/api/*` → API, resto → Client).

## Primeira instalação

Na VPS recém-criada (Ubuntu 24.04 LTS):

```bash
# Logar como root via SSH
ssh root@SEU_IP

# Rodar o bootstrap
curl -fsSL https://raw.githubusercontent.com/besco-ai/erplus/main/deploy/scripts/bootstrap.sh \
  | DOMAIN=erplus.besco.ai LETSENCRYPT_EMAIL=voce@dominio.com bash
```

O script instala Docker, liga firewall, cria `/opt/erplus/`, gera `.env`
com secrets aleatórios fortes, baixa o `docker-compose.prod.yml` e o
`Caddyfile`, cria swap de 2GB e agenda backup diário às 3h UTC.

## Subir os containers

```bash
cd /opt/erplus
docker compose pull
docker compose up -d
docker compose logs -f
```

Caddy negocia o certificado Let's Encrypt nos primeiros segundos — o
domínio `DOMAIN` **precisa já estar apontando (registro A)** para o IP
da VPS, senão o challenge falha.

Quando `api` ficar `healthy`, acessa `https://SEU_DOMINIO` e faz login
com as credenciais seed (giovanio / admin123).

## Atualizar para nova versão

Quando uma nova tag `v*.*.*` é publicada no GitHub, o workflow CI já
empurrou as imagens novas. Basta:

```bash
ssh root@SEU_IP
bash /opt/erplus/deploy.sh
# ou manualmente:
cd /opt/erplus && docker compose pull && docker compose up -d
```

A tag `:latest` sempre aponta para o release mais recente. Se quiser
pinar numa versão específica, edita `docker-compose.yml` trocando
`:latest` por `:1.0.0` (por exemplo) antes do `up -d`.

## Backups

Backup diário via cron (`/etc/cron.d/erplus-backup`) dumpa o Postgres
para `/opt/erplus/backups/erplus_YYYYMMDD_HHMMSS.sql.gz`, mantendo os
últimos 14 dias.

Restaurar um backup:

```bash
cd /opt/erplus
# Parar a API pra não escrever enquanto restauramos
docker compose stop api client
gunzip -c backups/erplus_20260420_030000.sql.gz | \
  docker compose exec -T db psql -U erplus
docker compose start api client
```

Além disso, a Hostinger tem o snapshot semanal do plano que serve de
backup de infra (se a VPS inteira morrer, o snapshot restaura).

## Operações do dia a dia

```bash
# Status dos containers
docker compose ps

# Logs da API
docker compose logs -f api

# Reiniciar algo específico
docker compose restart api

# Abrir shell no container da API
docker compose exec api bash

# Acessar o Postgres direto
docker compose exec db psql -U erplus
```

## Secrets

Todos os secrets (senha do Postgres, JWT key) vivem em `/opt/erplus/.env`
e são gerados aleatoriamente pelo bootstrap — **não são commitados e
jamais passam pelo CI**. Se precisar trocar alguma coisa, edita o arquivo
e `docker compose up -d` pra recarregar.

## Troubleshooting

### Caddy não pega certificado
- Confirmar que o DNS já propagou (`nslookup SEU_DOMINIO`).
- Ver log: `docker compose logs caddy`.
- O Let's Encrypt tem rate limit — se falhar muitas vezes seguidas,
  espera 1h antes de retentar.

### API não sobe (`unhealthy`)
- Ver log: `docker compose logs api`.
- Conferir connection string: `docker compose exec api env | grep ConnectionString`.
- Conferir Postgres: `docker compose exec db psql -U erplus -c '\dt identity.*'`.

### Disco enchendo
- Backups: `ls -lh /opt/erplus/backups/`. A rotação de 14 dias deveria
  cuidar, mas se não, `find backups -mtime +7 -delete` corta mais.
- Logs do Serilog: `du -sh /var/lib/docker/volumes/erplus_api-logs/_data/`
  — o rolling diário com 30 dias de retenção deveria limitar.
- Imagens antigas: `docker image prune -af`.
