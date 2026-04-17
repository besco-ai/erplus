# ERPlus — Monolito Modular

Sistema ERP para **EG Projetos & Consultorias**, construído como monolito modular.

## Stack

| Camada       | Tecnologia                     |
|--------------|--------------------------------|
| Backend      | .NET 10 (Minimal APIs)         |
| Frontend     | React 19 + Vite + Tailwind CSS |
| Banco        | PostgreSQL 16                  |
| Infra        | Docker + Docker Compose        |

## Arquitetura

```
src/
├── API/                  → Host principal (bootstrap, auth, CORS)
├── Shared/               → Kernel compartilhado (BaseEntity, Result, interfaces)
└── Modules/
    ├── Identity/         → Autenticação JWT, usuários, roles
    ├── CRM/              → Contatos, tipos, observações
    ├── Commercial/       → Deals, pipelines, orçamentos, contratos
    ├── Finance/          → Lançamentos, contas a pagar/receber
    ├── Projects/         → Empreendimentos, etapas
    ├── Production/       → Licenciamentos, projetos, design
    ├── Tasks/            → Tarefas e subtarefas
    ├── Schedule/         → Agenda e eventos
    ├── Documents/        → Anexos, templates, timeline
    ├── Automation/       → Regras de automação
    ├── Reports/          → Relatórios e dashboards
    └── Config/           → Serviços, configurações
```

Cada módulo tem schema próprio no PostgreSQL e se registra automaticamente via `IModuleInstaller`.

## Quick Start

### Com Docker (recomendado)

```bash
docker compose up -d
```

- **Frontend**: http://localhost:3000
- **API + Swagger**: http://localhost:8080/swagger
- **PostgreSQL**: localhost:5432

### Desenvolvimento local

**Backend:**
```bash
cd src/API
dotnet run
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

## Credenciais de teste

| E-mail                              | Senha     | Role             |
|-------------------------------------|-----------|------------------|
| giovanio@egconsultorias.com.br      | admin123  | Operador Master  |
| carlos@egconsultorias.com.br        | user123   | Colaborador      |

## Próximos passos

- [ ] Fase 2: CRUD completo do módulo Identity
- [ ] Fase 3: Módulo CRM end-to-end
- [ ] Fase 4: Módulos restantes
- [ ] Fase 5: Migrar UI do artefato para React com componentes reais
