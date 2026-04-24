#!/usr/bin/env bash
# =============================================================================
# run-migrations — aplica migrations nos 11 DbContexts do ERPlus
# =============================================================================
# Roda dentro da imagem erplus-migrations. Requer a variável de ambiente:
#
#   ConnectionStrings__DefaultConnection
#
# Ex.: "Host=db;Port=5432;Database=erplus;Username=erplus;Password=..."
#
# Sai com status 0 se todas as migrations aplicarem; !=0 na primeira falha.
# =============================================================================

set -euo pipefail

if [[ -z "${ConnectionStrings__DefaultConnection:-}" ]]; then
  echo "::error::ConnectionStrings__DefaultConnection não definida" >&2
  exit 1
fi

STARTUP="src/API/ERPlus.API.csproj"

# Pares "Nome do módulo : Nome do DbContext".
# Ordem importa apenas no sentido de logs — cada contexto tem seu próprio
# schema no Postgres, então não há dependência cruzada.
MODULES=(
  "Identity:IdentityDbContext"
  "CRM:CrmDbContext"
  "Commercial:CommercialDbContext"
  "Finance:FinanceDbContext"
  "Projects:ProjectsDbContext"
  "Production:ProductionDbContext"
  "Tasks:TasksDbContext"
  "Schedule:ScheduleDbContext"
  "Documents:DocumentsDbContext"
  "Automation:AutomationDbContext"
  "Config:ConfigDbContext"
  "Notifications:NotificationsDbContext"
)

echo "=========================================="
echo "ERPlus migrations — ${#MODULES[@]} contexts"
echo "=========================================="

for entry in "${MODULES[@]}"; do
  MOD="${entry%%:*}"
  CTX="${entry##*:}"
  PROJ="src/Modules/${MOD}/ERPlus.Modules.${MOD}.csproj"

  echo ""
  echo "→ ${MOD} (${CTX})"
  # --configuration Release é obrigatório aqui: o Dockerfile builda em
  # Release, mas `dotnet ef` assume Debug por padrão e tenta ler
  # bin/Debug/net10.0/*.deps.json — que não existe na imagem.
  dotnet ef database update \
    --project "${PROJ}" \
    --startup-project "${STARTUP}" \
    --context "${CTX}" \
    --configuration Release \
    --no-build
done

echo ""
echo "=========================================="
echo "✅ All migrations applied successfully."
echo "=========================================="
