#!/bin/bash
# ERPlus — Gerar migrations para todos os módulos
# Execute na raiz do projeto: ./scripts/generate-migrations.sh

set -e

STARTUP="src/API/ERPlus.API.csproj"
MODULES=(
  "Identity"
  "CRM"
  "Commercial"
  "Finance"
  "Projects"
  "Production"
  "Tasks"
  "Schedule"
  "Documents"
  "Automation"
  "Config"
)

echo "══════════════════════════════════════"
echo "  ERPlus — Gerando migrations"
echo "══════════════════════════════════════"
echo ""

# Instalar dotnet-ef se necessário
if ! dotnet tool list -g | grep -q "dotnet-ef"; then
  echo "Instalando dotnet-ef..."
  dotnet tool install --global dotnet-ef
fi

for mod in "${MODULES[@]}"; do
  PROJECT="src/Modules/$mod/ERPlus.Modules.$mod.csproj"
  echo "→ $mod"

  if [ ! -f "$PROJECT" ]; then
    echo "  ⚠ Projeto não encontrado: $PROJECT — pulando"
    continue
  fi

  dotnet ef migrations add InitialCreate \
    --project "$PROJECT" \
    --startup-project "$STARTUP" \
    --output-dir Infrastructure/Data/Migrations \
    --no-build 2>/dev/null || \
  dotnet ef migrations add InitialCreate \
    --project "$PROJECT" \
    --startup-project "$STARTUP" \
    --output-dir Infrastructure/Data/Migrations

  echo "  ✓ Migration criada"
done

echo ""
echo "══════════════════════════════════════"
echo "  Todas as migrations geradas!"
echo ""
echo "  Para aplicar ao banco:"
echo "  dotnet run --project src/API/ERPlus.API.csproj"
echo "  (as migrations rodam automaticamente no startup)"
echo "══════════════════════════════════════"
