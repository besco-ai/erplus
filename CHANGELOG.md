# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
versionamento seguindo [SemVer 2.0.0](https://semver.org/lang/pt-BR/).

## [1.0.0] — 2026-04-20

Primeira release estável do ERPlus. Cobre o monolito modular completo
conforme o artefato de UI original — 12 módulos, 5 grupos de navegação,
motor de automação configurável e cascatas de negócio.

### Added

#### Infraestrutura & navegação
- Sidebar com 5 grupos colapsáveis (Meu Espaço, Administrativo,
  Comercial, Produção, Suporte) + footer pinado (Configurações, Ajuda,
  Sair)
- "Meu Espaço" com as 8 telas pessoais filtrando pelo usuário logado
  (`?responsibleId={currentUser.id}`)
- 8 categorias de Produção como rotas dedicadas (Revisão Técnica,
  Licenciamentos, Design Criativo, Projetos, Incorporações,
  Supervisão, Vistorias, Averbações) + dashboard agregador
- Sub-items dinâmicos de pipeline em "Comercial › Negociações",
  carregados em runtime do backend + botão "Criar pipeline"

#### Dashboards (5 novos endpoints + 5 telas)
- Dashboard principal role-aware (Operador Master, Colaborador, Visitante)
  com cards de KPI e PDF export
- Dashboard por grupo: Comercial, Administrativo, Produção e Suporte —
  cada um com seu endpoint de agregação dedicado em `/api/reports/`

#### Entidades & dados
- `PurchaseOrder` (Cotações / Ordens de Compra) em Finance, com numeração
  auto `OC-NNN`, ciclo de status Rascunho → Enviada → Aprovada → Recebida/
  Cancelada, tela CRUD em Administrativo › Cotações
- `DealTimelineEntry` com registro automático de stage move, won, lost,
  criação/alteração de orçamento, criação de contrato e execução de
  automações. Endpoint `GET /commercial/deals/{id}/timeline`
- Contact ganha campos `Cellphone` e `Notes` (inline, distinto das
  observations)
- Pipelines de Commercial com CRUD completo (criar/editar/excluir pipeline
  e stages, incluindo `AutoTasksJson` por stage)
- Seeds estruturais: 3 pipelines iniciais (Atendimento Inicial,
  Consultoria & Captação, Definição & Contratação), 4 tipos de contato,
  2 diligence templates, 3 briefing templates, 3 document templates com
  placeholders

#### Motor de negócio (cascatas)
- **Deal won → Empreendimento**: cria `Project` no primeiro pipeline/
  stage de Projects
- **Quote approved → Contract**: já cria contrato com vínculo; reverte
  se status muda dentro de 24h (janela de reversão)
- **AR received → FinancialEntry**: A/R marcado como "Recebido" gera
  lançamento receita/Efetuado
- **Stage change → AutoTasks**: lê `AutoTasksJson` do stage destino e
  cria TaskItems automaticamente

#### Motor de automação
- Entidade `AutomationRule` com triggers `stage_enter`, `deal_won`,
  `task_complete`
- Ações `create_task`, `move_pipeline`, `load_diligence`
- Condições AND opcionais em `ConditionJson` contra 8 campos do deal
  (value, probability, dealStatus, pipelineId, stageId, businessTypeId,
  clientId, responsibleId) com 7 operadores (eq, ne, gt, lt, gte, lte,
  contains)
- Execução idempotente com timeline logging; falhas de regra
  silenciadas pra não quebrar o move do deal

#### Templates de orçamento e contrato
- `DocumentTemplate` CRUD (tipos `orcamento` / `contrato`)
- Endpoint `POST /documents/templates/{id}/render` faz interpolação de
  `{{placeholder}}` com payload de variáveis, retornando ainda a lista
  de placeholders não-preenchidos pra feedback
- 3 templates seed (Orçamento Viabilidade, Orçamento Laudo Geotécnico,
  Contrato Prestação de Serviços)

#### Telas com tabs (modal expandido)
- **DealDetailModal** com 7 abas: Dados, Orçamentos, Contratos, Atas,
  Briefing, Diligência, Timeline — atas/diligence/briefing com create
  inline e checklist editor interativo compartilhado
- **ContactDetailModal** com 6 abas: Dados, Observações, Negócios,
  Orçamentos, Contratos, Empreendimentos — tabs relacionais puxam por
  `?clientId={id}`

#### Configurações (8 abas)
- Empresa (form com 9 campos, persistido em `/config/settings`)
- Usuários (lista + link pra gestão completa em /equipe)
- Tipos de Contato (CRUD), Tipos de Negócio (CRUD), Serviços (CRUD),
  Centros de Custo (CRUD)
- Templates (CRUD com filtro por tipo)
- Automações (CRUD com builder de trigger/ação/condição)

#### UI/UX
- Botão "Acesso rápido (MODO DEMO)" na tela de login com os 2 usuários
  seed
- Toast notifications sem dependências externas, integrado em saves
  principais
- Print button em cada dashboard de módulo usando `window.print()` +
  CSS de impressão

### Fixed

- `ERPlus.sln` com `\r\n` no cabeçalho quebrava `dotnet restore`
- `Dockerfile.api` chamando `dotnet restore` na `.sln` (workaround: usa
  o csproj principal)
- `Dockerfile.api` não copiava `Directory.Build.props` antes do restore,
  deixando `TargetFramework` vazio
- `Dockerfile.api` não tinha `curl` na imagem base (usado pelo
  healthcheck do compose)
- `Dockerfile.client` usava `npm ci` sem `package-lock.json`
- `nginx.conf` com trailing slash no `proxy_pass` strippava `/api/`
- `ERPlus.Shared` sem `FrameworkReference Microsoft.AspNetCore.App`,
  quebrando `IModuleInstaller`
- `PdfReportService` chamava `.BorderBottom()` em `TextBlockDescriptor`
  (QuestPDF API incorreta)
- `docker-compose.yml` mapeando porta 5432 que colidia com Postgres local
  (remapeado pra 5433)
- Hashes BCrypt no seed de `User` eram placeholders inválidos (agora
  gerados em runtime pelo IdentityModuleInstaller)
- Seed demo data pesado removido dos DbContexts (apenas `role_permissions`
  estrutural é mantido como seed)
- `GET /schedule/events?from=X&to=Y` quebrava com
  `DateTime.Kind=Unspecified` (normalizado pra UTC)
- `PlanningPage` lia `user.userId` (inexistente) em vez de `user.id` —
  filtro silenciosamente no-op
- `client/src/App.jsx` sem rotas pra 8 categorias de produção nem para
  dashboards por grupo
- Sidebar usava header fixo pra "Meu Espaço" em vez de grupo colapsável
- Menu "Pipeline" vs "Negociações" e "Tickets" vs "Chamados"
  (realinhado com o artefato)

### Changed

- Migrations `InitialCreate` geradas para os 11 módulos com DbContext
  (Identity, CRM, Commercial, Finance, Projects, Production, Tasks,
  Schedule, Documents, Automation, Config)
- `UpdateRuleRequest` da Automation expandido pra aceitar todos os
  campos (antes só Name + Active)
- `ContactDetail` refatorado de modal single-pane pra tabbed 4xl
- `ConfigPage` refatorado de 2 tabs pra 8 tabs

### Internal / docs
- `.dockerignore` adicionado
- `.gitignore` ignora `**/logs/` (Serilog runtime output)
- `Microsoft.EntityFrameworkCore.Design` registrado em
  `ERPlus.API.csproj` pra tooling `dotnet ef` funcionar
- `global.json` pinando SDK 10.0 com `allowPrerelease=true`
- `client/package-lock.json` commitado (habilita `npm ci`)
- CI pipeline corrigido (restore/build via csproj, setup-dotnet via
  global.json, lockfile pro cache do npm)

[1.0.0]: https://github.com/besco-ai/erplus/releases/tag/v1.0.0
