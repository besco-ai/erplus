# ERPlus — Guia de Onboarding

Guia passo a passo para configurar uma máquina do zero, clonar o repositório e rodar o projeto ERPlus localmente.

## Pré-requisitos

O projeto usa a seguinte stack:

| Ferramenta | Versão mínima | Para quê |
|---|---|---|
| .NET SDK | 10.0 (preview) | Backend API |
| Node.js | 22 LTS | Frontend React |
| Docker Desktop | 4.x | Containers (API + DB + Frontend) |
| Git | 2.x | Versionamento |
| VS Code ou Rider | Qualquer | IDE (opcional, mas recomendado) |

---

## 1. Instalar o Git

### Windows
Baixe e instale: https://git-scm.com/download/win

Após instalar, abra o terminal e configure:
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update && sudo apt install git -y
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### macOS
```bash
brew install git
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### Conectar ao GitHub via SSH (recomendado)

Gere uma chave SSH:
```bash
ssh-keygen -t ed25519 -C "seu@email.com"
```

Pressione Enter para aceitar o caminho padrão. Copie a chave pública:
```bash
# Windows (Git Bash)
cat ~/.ssh/id_ed25519.pub | clip

# Linux
cat ~/.ssh/id_ed25519.pub | xclip -selection clipboard

# macOS
cat ~/.ssh/id_ed25519.pub | pbcopy
```

Vá em https://github.com/settings/keys, clique "New SSH key", cole a chave e salve.

Teste a conexão:
```bash
ssh -T git@github.com
```

---

## 2. Instalar o Docker Desktop

### Windows / macOS
Baixe e instale: https://www.docker.com/products/docker-desktop/

Após instalar, abra o Docker Desktop e aguarde ele iniciar (ícone na bandeja fica verde).

Verifique:
```bash
docker --version
docker compose version
```

### Linux (Ubuntu)
```bash
# Remover versões antigas
sudo apt remove docker docker-engine docker.io containerd runc 2>/dev/null

# Instalar dependências
sudo apt update
sudo apt install ca-certificates curl gnupg -y

# Adicionar repositório oficial
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# Permitir usar docker sem sudo
sudo usermod -aG docker $USER
newgrp docker

# Verificar
docker --version
docker compose version
```

---

## 3. Instalar o .NET 10 SDK

O .NET 10 ainda está em preview. Se na data em que você ler este guia já existir a versão estável, use-a.

### Windows / macOS
Baixe o SDK em: https://dotnet.microsoft.com/download/dotnet/10.0

Instale o `.exe` (Windows) ou `.pkg` (macOS) e reinicie o terminal.

### Linux (Ubuntu)
```bash
# Adicionar feed do .NET
sudo apt install dotnet-sdk-10.0 -y

# Alternativa: via script oficial
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 10.0

# Adicionar ao PATH (colocar no ~/.bashrc ou ~/.zshrc)
export DOTNET_ROOT=$HOME/.dotnet
export PATH=$PATH:$DOTNET_ROOT:$DOTNET_ROOT/tools
```

Verifique:
```bash
dotnet --version
```

Instale a ferramenta de migrations:
```bash
dotnet tool install --global dotnet-ef
```

---

## 4. Instalar o Node.js 22

### Windows / macOS
Baixe o LTS em: https://nodejs.org/

Ou use o nvm (recomendado):
```bash
# Instalar nvm (Windows: use nvm-windows https://github.com/coreybutler/nvm-windows)

# Linux/macOS
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc

# Instalar Node 22
nvm install 22
nvm use 22
```

Verifique:
```bash
node --version
npm --version
```

---

## 5. Clonar o repositório

### Se o repositório já existe no GitHub:
```bash
# Via SSH (recomendado)
git clone git@github.com:SEU_USUARIO/erplus.git

# Via HTTPS
git clone https://github.com/SEU_USUARIO/erplus.git

cd erplus
```

### Se está começando do zero com o tar.gz:
```bash
# Descompactar o arquivo
tar -xzf erplus-final.tar.gz
cd erplus

# Inicializar o repositório Git
git init
git add .
git commit -m "feat: initial commit - ERPlus modular monolith"

# Conectar ao repositório remoto
git remote add origin git@github.com:SEU_USUARIO/erplus.git
git branch -M main
git push -u origin main
```

---

## 6. Rodar com Docker (caminho mais rápido)

Este é o caminho mais simples — sobe tudo com um comando:

```bash
cd erplus
docker compose up -d
```

Aguarde os containers subirem (primeira vez demora ~2-3 min para build). Acompanhe:
```bash
docker compose logs -f
```

Quando ver `ERPlus API iniciada com 12 módulos`, está pronto.

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API + Swagger | http://localhost:8080/swagger |
| Health check | http://localhost:8080/health |
| PostgreSQL | localhost:5432 (user: erplus / pass: erplus123) |

### Credenciais de teste
| E-mail | Senha | Perfil |
|---|---|---|
| giovanio@egconsultorias.com.br | admin123 | Operador Master |
| carlos@egconsultorias.com.br | user123 | Colaborador |

### Comandos úteis do Docker
```bash
# Parar tudo
docker compose down

# Parar e apagar dados do banco
docker compose down -v

# Rebuild após alterar código
docker compose up -d --build

# Ver logs de um serviço específico
docker compose logs -f api
docker compose logs -f client
docker compose logs -f db

# Acessar o container do banco
docker compose exec db psql -U erplus
```

---

## 7. Rodar em desenvolvimento (backend + frontend separados)

Este modo é melhor para desenvolvimento ativo — hot reload funciona nos dois lados.

### 7.1 Subir apenas o PostgreSQL via Docker
```bash
docker compose up -d db
```

### 7.2 Gerar as migrations
```bash
# Na raiz do projeto
chmod +x scripts/generate-migrations.sh
./scripts/generate-migrations.sh
```

Se estiver no Windows sem bash:
```powershell
# Rodar manualmente para cada módulo
dotnet ef migrations add InitialCreate --project src/Modules/Identity/ERPlus.Modules.Identity.csproj --startup-project src/API/ERPlus.API.csproj --output-dir Infrastructure/Data/Migrations

dotnet ef migrations add InitialCreate --project src/Modules/CRM/ERPlus.Modules.CRM.csproj --startup-project src/API/ERPlus.API.csproj --output-dir Infrastructure/Data/Migrations

dotnet ef migrations add InitialCreate --project src/Modules/Commercial/ERPlus.Modules.Commercial.csproj --startup-project src/API/ERPlus.API.csproj --output-dir Infrastructure/Data/Migrations

dotnet ef migrations add InitialCreate --project src/Modules/Finance/ERPlus.Modules.Finance.csproj --startup-project src/API/ERPlus.API.csproj --output-dir Infrastructure/Data/Migrations

dotnet ef migrations add InitialCreate --project src/Modules/Projects/ERPlus.Modules.Projects.csproj --startup-project src/API/ERPlus.API.csproj --output-dir Infrastructure/Data/Migrations

dotnet ef migrations add InitialCreate --project src/Modules/Production/ERPlus.Modules.Production.csproj --startup-project src/API/ERPlus.API.csproj --output-dir Infrastructure/Data/Migrations

dotnet ef migrations add InitialCreate --project src/Modules/Tasks/ERPlus.Modules.Tasks.csproj --startup-project src/API/ERPlus.API.csproj --output-dir Infrastructure/Data/Migrations

dotnet ef migrations add InitialCreate --project src/Modules/Schedule/ERPlus.Modules.Schedule.csproj --startup-project src/API/ERPlus.API.csproj --output-dir Infrastructure/Data/Migrations

dotnet ef migrations add InitialCreate --project src/Modules/Documents/ERPlus.Modules.Documents.csproj --startup-project src/API/ERPlus.API.csproj --output-dir Infrastructure/Data/Migrations

dotnet ef migrations add InitialCreate --project src/Modules/Automation/ERPlus.Modules.Automation.csproj --startup-project src/API/ERPlus.API.csproj --output-dir Infrastructure/Data/Migrations

dotnet ef migrations add InitialCreate --project src/Modules/Config/ERPlus.Modules.Config.csproj --startup-project src/API/ERPlus.API.csproj --output-dir Infrastructure/Data/Migrations
```

### 7.3 Rodar o backend
```bash
cd src/API
dotnet run
```

A API sobe em http://localhost:5000 (ou a porta configurada). As migrations rodam automaticamente no startup. Swagger fica em http://localhost:5000/swagger.

### 7.4 Rodar o frontend
```bash
# Em outro terminal
cd client
npm install
npm run dev
```

O frontend sobe em http://localhost:5173 com hot reload. O proxy em `vite.config.js` redireciona `/api/*` para o backend automaticamente.

---

## 8. Estrutura do projeto

```
erplus/
├── .github/workflows/ci.yml    ← CI/CD (GitHub Actions)
├── docker/                     ← Dockerfiles, nginx, init.sql
├── scripts/                    ← Script de migrations
├── src/
│   ├── API/                    ← Host principal (.NET 10)
│   │   ├── Middleware/         ← Exception handler, rate limit
│   │   ├── Program.cs          ← Bootstrap, JWT, Swagger, módulos
│   │   └── appsettings.*.json  ← Configurações por ambiente
│   ├── Shared/                 ← Kernel compartilhado
│   │   ├── Domain/             ← BaseEntity
│   │   ├── Application/        ← Result<T>, PagedResult<T>
│   │   └── Contracts/          ← IModuleInstaller, ICurrentUser
│   └── Modules/
│       ├── Identity/           ← Auth JWT, users, permissions
│       ├── CRM/                ← Contatos, observações
│       ├── Commercial/         ← Deals, pipelines, quotes, contracts
│       ├── Finance/            ← Lançamentos, contas a pagar/receber
│       ├── Projects/           ← Empreendimentos, etapas
│       ├── Production/         ← 8 categorias de produção
│       ├── Tasks/              ← Tarefas com subtarefas
│       ├── Schedule/           ← Agenda e eventos
│       ├── Documents/          ← Anexos, templates, timeline, tickets
│       ├── Automation/         ← Regras de automação
│       ├── Reports/            ← Dashboard agregado, PDF
│       └── Config/             ← Serviços, configurações
├── client/                     ← Frontend React 19
│   ├── src/
│   │   ├── components/         ← Layout (Sidebar, Topbar, AppLayout)
│   │   ├── features/           ← 17 telas organizadas por módulo
│   │   ├── hooks/              ← useAuthStore (Zustand)
│   │   └── services/           ← api.js (Axios + auto-refresh)
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml
├── ERPlus.sln
└── .env.example
```

---

## 9. Fluxo de desenvolvimento

### Criar um novo módulo
1. Crie a pasta em `src/Modules/NomeModulo/` com as subcamadas (Domain, Application, Infrastructure, Endpoints)
2. Crie o `.csproj` referenciando `ERPlus.Shared`
3. Crie as entidades em `Domain/Entities/`
4. Crie o `DbContext` em `Infrastructure/Data/` com schema próprio
5. Crie o `ModuleInstaller` implementando `IModuleInstaller`
6. Adicione o projeto ao `ERPlus.sln` e como referência no `ERPlus.API.csproj`
7. O módulo é descoberto automaticamente por reflection no startup

### Criar uma nova tela no frontend
1. Crie a pasta em `client/src/features/nome/`
2. Crie o componente `.jsx`
3. Adicione o import e a rota em `client/src/App.jsx`
4. Adicione o item no menu em `client/src/components/layout/Sidebar.jsx`

### Gerar migration após alterar entidades
```bash
dotnet ef migrations add NomeDaMigration \
  --project src/Modules/MODULO/ERPlus.Modules.MODULO.csproj \
  --startup-project src/API/ERPlus.API.csproj \
  --output-dir Infrastructure/Data/Migrations
```

### Convenções de commit
```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração sem mudar comportamento
docs: documentação
chore: tarefas de manutenção
```

---

## 10. Troubleshooting

### "A porta 5432 já está em uso"
Outro PostgreSQL está rodando. Pare-o ou mude a porta no `docker-compose.yml`.

### "Connection refused" no frontend
O backend ainda não subiu. Verifique com `docker compose logs api` ou aguarde o health check.

### Migrations falham
Certifique-se de que o PostgreSQL está rodando (`docker compose up -d db`) e que a connection string em `appsettings.json` está correta.

### "ERPlus.Modules.*.dll not found"
Execute `dotnet build` na raiz antes de rodar. O auto-discovery depende das DLLs compiladas.

### Docker build muito lento
Na primeira vez é normal (baixa imagens base). Builds subsequentes usam cache. Se quiser forçar rebuild: `docker compose build --no-cache`.

### Senha dos usuários seed não funciona
Os hashes no seed são pré-computados. Se precisar resetar, use o endpoint `POST /api/identity/users/{id}/reset-password` via Swagger, ou apague o volume do banco (`docker compose down -v`) e suba novamente.

---

## 11. Próximos passos

Após o projeto estar rodando:

1. Explore o Swagger em `/swagger` para ver todos os endpoints disponíveis
2. Faça login com as credenciais de teste
3. Navegue pelas 17 telas e valide o fluxo
4. Comece a customizar para as necessidades específicas do cliente
5. Configure o `.env` com credenciais de produção quando for fazer deploy

---

*ERPlus v1.0 — EG Projetos & Consultorias*
*Monolito modular com .NET 10, React 19, PostgreSQL 16 e Docker*
