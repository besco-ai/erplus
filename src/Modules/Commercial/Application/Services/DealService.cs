using ERPlus.Modules.Automation.Infrastructure.Data;
using ERPlus.Modules.Commercial.Domain.Entities;
using ERPlus.Modules.Commercial.Infrastructure.Data;
using ERPlus.Modules.Projects.Domain.Entities;
using ERPlus.Modules.Projects.Infrastructure.Data;
using ERPlus.Modules.Tasks.Domain.Entities;
using ERPlus.Modules.Tasks.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ERPlus.Modules.Commercial.Application.Services;

public class DealService
{
    private readonly CommercialDbContext _db;
    private readonly ProjectsDbContext _projects;
    private readonly TasksDbContext _tasks;
    private readonly AutomationDbContext _automation;

    public DealService(
        CommercialDbContext db,
        ProjectsDbContext projects,
        TasksDbContext tasks,
        AutomationDbContext automation)
    {
        _db = db;
        _projects = projects;
        _tasks = tasks;
        _automation = automation;
    }

    public async Task<Result<List<DealDto>>> GetAllAsync(int? pipelineId, int? stageId, string? status, int? responsibleId)
    {
        var query = _db.Deals.Include(d => d.Pipeline).Include(d => d.Stage).AsQueryable();

        if (pipelineId.HasValue) query = query.Where(d => d.PipelineId == pipelineId.Value);
        if (stageId.HasValue) query = query.Where(d => d.StageId == stageId.Value);
        if (!string.IsNullOrEmpty(status)) query = query.Where(d => d.DealStatus == status);
        if (responsibleId.HasValue) query = query.Where(d => d.ResponsibleId == responsibleId.Value);

        var deals = await query.OrderByDescending(d => d.Date)
            .Select(d => new DealDto(
                d.Id, d.Title, d.ClientId, null, d.Value,
                d.PipelineId, d.Pipeline.Name, d.StageId, d.Stage.Name,
                d.ResponsibleId, null, d.Date, d.Probability, d.DealStatus,
                d.BusinessTypeId, null, d.Registro, d.InscricaoImob, d.EndEmpreendimento,
                d.Quotes.Count, d.Contracts.Count, d.Atas.Count))
            .ToListAsync();

        return Result<List<DealDto>>.Success(deals);
    }

    public async Task<Result<DealDetailDto>> GetByIdAsync(int id)
    {
        var d = await _db.Deals
            .Include(x => x.Stage).Include(x => x.Quotes)
            .Include(x => x.Contracts).Include(x => x.Atas)
            .Include(x => x.Diligences)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (d is null) return Result<DealDetailDto>.NotFound();

        var briefings = await _db.DealBriefings.Where(b => b.DealId == id).ToListAsync();

        return Result<DealDetailDto>.Success(new DealDetailDto(
            d.Id, d.Title, d.ClientId, null, d.Value,
            d.PipelineId, d.StageId, d.Stage.Name, d.ResponsibleId,
            d.Date, d.Probability, d.Notes, d.DealStatus, d.BusinessTypeId,
            d.Registro, d.InscricaoImob, d.EndEmpreendimento,
            d.Quotes.Select(q => new QuoteDto(q.Id, q.Numero, q.DealId, q.Titulo, q.ClientId,
                q.ItemsJson, q.Valor, q.Status, q.Data, q.Validade, q.Conditions, q.StatusChangedAt)).ToList(),
            d.Contracts.Select(c => new ContractDto(c.Id, c.Numero, c.QuoteId, c.DealId, c.ClientId,
                c.Titulo, c.Valor, c.Status, c.DataInicio, c.DataFim, c.ResponsibleId,
                c.Registro, c.InscricaoImob, c.EndEmpreendimento, c.BusinessTypeId)).ToList(),
            d.Atas.OrderByDescending(a => a.Date).Select(a => new DealAtaDto(
                a.Id, a.DealId, a.Title, a.Date, a.Content, a.LinksJson)).ToList(),
            d.Diligences.Select(di => new DealDiligenceDto(
                di.Id, di.DealId, di.TemplateId, null, di.ItemsJson)).ToList(),
            briefings.Select(b => new DealBriefingDto(
                b.Id, b.DealId, b.TemplateId, null, b.ItemsJson)).ToList()));
    }

    public async Task<Result<DealDto>> CreateAsync(CreateDealRequest r)
    {
        if (r.ClientId <= 0) return Result<DealDto>.Failure("Cliente é obrigatório");

        var pipeline = await _db.Pipelines.Include(p => p.Stages).FirstOrDefaultAsync(p => p.Id == r.PipelineId);
        if (pipeline is null) return Result<DealDto>.Failure("Pipeline não encontrado");

        var stage = pipeline.Stages.FirstOrDefault(s => s.Id == r.StageId);
        if (stage is null) return Result<DealDto>.Failure("Etapa não pertence ao pipeline selecionado");

        var deal = new Deal
        {
            Title = r.Title?.Trim() ?? "",
            ClientId = r.ClientId,
            Value = r.Value,
            PipelineId = r.PipelineId,
            StageId = r.StageId,
            ResponsibleId = r.ResponsibleId > 0 ? r.ResponsibleId : 1,
            Date = DateTime.UtcNow,
            Probability = r.Probability,
            Notes = r.Notes,
            DealStatus = "Ativo",
            BusinessTypeId = r.BusinessTypeId,
            Registro = r.Registro,
            InscricaoImob = r.InscricaoImob,
            EndEmpreendimento = r.EndEmpreendimento
        };

        _db.Deals.Add(deal);
        await _db.SaveChangesAsync();

        return Result<DealDto>.Created(new DealDto(
            deal.Id, deal.Title, deal.ClientId, null, deal.Value,
            deal.PipelineId, pipeline.Name, deal.StageId, stage.Name,
            deal.ResponsibleId, null, deal.Date, deal.Probability, deal.DealStatus,
            deal.BusinessTypeId, null, deal.Registro, deal.InscricaoImob, deal.EndEmpreendimento,
            0, 0, 0));
    }

    public async Task<Result<DealDto>> UpdateAsync(int id, UpdateDealRequest r)
    {
        var deal = await _db.Deals.Include(d => d.Stage).Include(d => d.Pipeline).FirstOrDefaultAsync(d => d.Id == id);
        if (deal is null) return Result<DealDto>.NotFound();

        if (r.Title is not null) deal.Title = r.Title.Trim();
        if (r.ClientId.HasValue) deal.ClientId = r.ClientId.Value;
        if (r.Value.HasValue) deal.Value = r.Value.Value;
        if (r.ResponsibleId.HasValue) deal.ResponsibleId = r.ResponsibleId.Value;
        if (r.Probability.HasValue) deal.Probability = r.Probability.Value;
        if (r.Notes is not null) deal.Notes = r.Notes;
        if (r.DealStatus is not null) deal.DealStatus = r.DealStatus;
        if (r.BusinessTypeId.HasValue) deal.BusinessTypeId = r.BusinessTypeId;
        if (r.Registro is not null) deal.Registro = r.Registro;
        if (r.InscricaoImob is not null) deal.InscricaoImob = r.InscricaoImob;
        if (r.EndEmpreendimento is not null) deal.EndEmpreendimento = r.EndEmpreendimento;

        if (r.StageId.HasValue && r.StageId.Value != deal.StageId)
        {
            var newStage = await _db.PipelineStages.FindAsync(r.StageId.Value);
            if (newStage is null) return Result<DealDto>.Failure("Etapa não encontrada");
            deal.StageId = r.StageId.Value;
        }

        deal.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<DealDto>.Success(new DealDto(
            deal.Id, deal.Title, deal.ClientId, null, deal.Value,
            deal.PipelineId, deal.Pipeline.Name, deal.StageId, deal.Stage.Name,
            deal.ResponsibleId, null, deal.Date, deal.Probability, deal.DealStatus,
            deal.BusinessTypeId, null, deal.Registro, deal.InscricaoImob, deal.EndEmpreendimento,
            0, 0, 0));
    }

    public async Task<Result<bool>> MoveAsync(int id, MoveDealRequest r)
    {
        var deal = await _db.Deals.FindAsync(id);
        if (deal is null) return Result<bool>.NotFound();

        var stage = await _db.PipelineStages.FindAsync(r.StageId);
        if (stage is null) return Result<bool>.Failure("Etapa não encontrada");

        var oldStageId = deal.StageId;
        deal.StageId = r.StageId;
        if (r.PipelineId.HasValue) deal.PipelineId = r.PipelineId.Value;
        deal.UpdatedAt = DateTime.UtcNow;

        if (oldStageId != r.StageId)
        {
            AddTimeline(deal.Id, "stage", $"Movido para etapa \"{stage.Name}\"");
        }
        await _db.SaveChangesAsync();

        // Cascata: se a etapa de destino tem AutoTasksJson, criar as tarefas
        // correspondentes para este deal, atribuídas ao responsável do deal.
        await CreateAutoTasksForStageAsync(deal, stage);

        // Automation engine: dispara regras com trigger stage_enter compatíveis
        // com este stage (e/ou pipeline). Cada regra executa uma ação simples
        // (create_task, move_pipeline).
        await RunAutomationsAsync(deal, "stage_enter", stage);

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> WinAsync(int id)
    {
        var deal = await _db.Deals.Include(d => d.Pipeline).Include(d => d.Stage)
            .FirstOrDefaultAsync(d => d.Id == id);
        if (deal is null) return Result<bool>.NotFound();

        deal.DealStatus = "Ganho";
        deal.UpdatedAt = DateTime.UtcNow;
        AddTimeline(deal.Id, "won", "Negócio marcado como ganho");
        await _db.SaveChangesAsync();

        // Cascata: criar Empreendimento (Project) no primeiro stage do primeiro
        // pipeline de Projects. Se ainda não há pipeline de projects cadastrado,
        // a cascata é silenciosamente pulada — o deal continua "Ganho", só não
        // gera o empreendimento automaticamente.
        await CreateProjectFromDealAsync(deal);

        // Automation engine: trigger deal_won
        await RunAutomationsAsync(deal, "deal_won", null);

        return Result<bool>.Success(true);
    }

    // ── Cascatas ──

    private async Task CreateProjectFromDealAsync(Deal deal)
    {
        var pipeline = await _projects.Pipelines
            .OrderBy(p => p.Order)
            .FirstOrDefaultAsync();
        if (pipeline is null) return;

        var firstStage = await _projects.Stages
            .Where(s => s.PipelineId == pipeline.Id)
            .OrderBy(s => s.Order)
            .FirstOrDefaultAsync();
        if (firstStage is null) return;

        _projects.Projects.Add(new Project
        {
            Title = deal.Title,
            ClientId = deal.ClientId,
            DealId = deal.Id,
            PipelineId = pipeline.Id,
            StageId = firstStage.Id,
            Value = deal.Value,
            ResponsibleId = deal.ResponsibleId,
            StartDate = DateTime.UtcNow,
            Registro = deal.Registro,
            InscricaoImob = deal.InscricaoImob,
            EndEmpreendimento = deal.EndEmpreendimento,
            BusinessTypeId = deal.BusinessTypeId,
            CreatedAt = DateTime.UtcNow
        });
        await _projects.SaveChangesAsync();
    }

    private async Task CreateAutoTasksForStageAsync(Deal deal, PipelineStage stage)
    {
        if (string.IsNullOrWhiteSpace(stage.AutoTasksJson)) return;

        List<string>? titles;
        try
        {
            titles = JsonSerializer.Deserialize<List<string>>(stage.AutoTasksJson);
        }
        catch (JsonException)
        {
            return;
        }
        if (titles is null || titles.Count == 0) return;

        foreach (var title in titles)
        {
            if (string.IsNullOrWhiteSpace(title)) continue;
            _tasks.Tasks.Add(new TaskItem
            {
                Title = title,
                DealId = deal.Id,
                ResponsibleId = deal.ResponsibleId,
                Status = "Não iniciado",
                CreatedAt = DateTime.UtcNow
            });
        }
        await _tasks.SaveChangesAsync();
    }

    public async Task<Result<bool>> LoseAsync(int id)
    {
        var deal = await _db.Deals.FindAsync(id);
        if (deal is null) return Result<bool>.NotFound();

        deal.DealStatus = "Perdido";
        deal.UpdatedAt = DateTime.UtcNow;
        AddTimeline(deal.Id, "lost", "Negócio marcado como perdido");
        await _db.SaveChangesAsync();

        return Result<bool>.Success(true);
    }

    public async Task<Result<List<DealTimelineEntryDto>>> GetTimelineAsync(int dealId)
    {
        var entries = await _db.DealTimeline
            .Where(t => t.DealId == dealId)
            .OrderByDescending(t => t.Date)
            .Select(t => new DealTimelineEntryDto(t.Id, t.DealId, t.Date, t.Type, t.Text))
            .ToListAsync();
        return Result<List<DealTimelineEntryDto>>.Success(entries);
    }

    internal void AddTimeline(int dealId, string type, string text)
    {
        _db.DealTimeline.Add(new DealTimelineEntry
        {
            DealId = dealId,
            Date = DateTime.UtcNow,
            Type = type,
            Text = text,
            CreatedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Executa as regras de automação configuradas e compatíveis com o evento.
    /// Filtra por trigger e (quando especificado) TriggerStageId/TriggerPipelineId,
    /// e só executa regras ativas. Cada ação falha é silenciosamente ignorada
    /// para não derrubar a operação principal do deal.
    /// </summary>
    private async Task RunAutomationsAsync(Deal deal, string trigger, PipelineStage? stage)
    {
        var rules = await _automation.Rules
            .Where(r => r.Active && r.Trigger == trigger)
            .ToListAsync();

        foreach (var rule in rules)
        {
            // Filtro por etapa/pipeline quando a regra especifica
            if (rule.TriggerStageId.HasValue && (stage?.Id ?? 0) != rule.TriggerStageId.Value) continue;
            if (rule.TriggerPipelineId.HasValue && deal.PipelineId != rule.TriggerPipelineId.Value) continue;

            try
            {
                await ExecuteRuleActionAsync(rule, deal);
                AddTimeline(deal.Id, "automation",
                    $"Automação \"{rule.Name}\" executada ({rule.Action})");
            }
            catch
            {
                // Swallow — uma regra mal configurada não deve falhar o move.
            }
        }
        await _db.SaveChangesAsync();
    }

    private async Task ExecuteRuleActionAsync(
        Automation.Domain.Entities.AutomationRule rule, Deal deal)
    {
        switch (rule.Action)
        {
            case "create_task":
                if (!string.IsNullOrWhiteSpace(rule.TaskTitle))
                {
                    _tasks.Tasks.Add(new TaskItem
                    {
                        Title = rule.TaskTitle,
                        DealId = deal.Id,
                        ResponsibleId = deal.ResponsibleId,
                        Status = "Não iniciado",
                        CreatedAt = DateTime.UtcNow
                    });
                    await _tasks.SaveChangesAsync();
                }
                break;

            case "move_pipeline":
                if (rule.ActionPipelineId.HasValue && rule.ActionStageId.HasValue)
                {
                    deal.PipelineId = rule.ActionPipelineId.Value;
                    deal.StageId = rule.ActionStageId.Value;
                    deal.UpdatedAt = DateTime.UtcNow;
                }
                break;

            case "load_diligence":
                if (rule.DiligenceTemplateId.HasValue)
                {
                    // Clona items do template como uma DealDiligence nova, com
                    // items ainda não concluídos. Se já existir uma diligência
                    // para esse template no deal, não duplica.
                    var already = await _db.DealDiligences
                        .AnyAsync(d => d.DealId == deal.Id && d.TemplateId == rule.DiligenceTemplateId.Value);
                    if (!already)
                    {
                        var template = await _db.DiligenceTemplates
                            .FirstOrDefaultAsync(t => t.Id == rule.DiligenceTemplateId.Value);
                        if (template is not null)
                        {
                            _db.DealDiligences.Add(new DealDiligence
                            {
                                DealId = deal.Id,
                                TemplateId = template.Id,
                                ItemsJson = template.ItemsJson,
                                CreatedAt = DateTime.UtcNow
                            });
                            AddTimeline(deal.Id, "diligence",
                                $"Diligência \"{template.Name}\" carregada pela automação");
                        }
                    }
                }
                break;

            default:
                break;
        }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var deal = await _db.Deals.FindAsync(id);
        if (deal is null) return Result<bool>.NotFound();

        deal.IsDeleted = true;
        deal.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<bool>.Success(true);
    }

    // ── Funnel ──
    public async Task<Result<List<PipelineDto>>> GetPipelinesAsync()
    {
        var pipelines = await _db.Pipelines
            .Include(p => p.Stages.OrderBy(s => s.Order))
            .Include(p => p.Deals)
            .OrderBy(p => p.Order)
            .ToListAsync();

        var result = pipelines.Select(p => new PipelineDto(
            p.Id, p.Name, p.Order,
            p.Stages.Select(s => new PipelineStageDto(
                s.Id, s.Name, s.Order, s.AutoTasksJson,
                p.Deals.Count(d => d.StageId == s.Id && d.DealStatus == "Ativo"),
                p.Deals.Where(d => d.StageId == s.Id && d.DealStatus == "Ativo").Sum(d => d.Value)
            )).ToList()
        )).ToList();

        return Result<List<PipelineDto>>.Success(result);
    }

    public async Task<Result<PipelineDto>> CreatePipelineAsync(CreatePipelineRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Name)) return Result<PipelineDto>.Failure("Nome é obrigatório");
        var maxOrder = await _db.Pipelines.MaxAsync(p => (int?)p.Order) ?? -1;
        var pipeline = new Pipeline { Name = r.Name.Trim(), Order = maxOrder + 1 };
        _db.Pipelines.Add(pipeline);

        // Stages opcionais no payload de criação. Se o caller não mandar nada,
        // cria um stage padrão pra pipeline não nascer vazio.
        var stages = new List<PipelineStage>();
        var payloadStages = (r.Stages is { Count: > 0 }) ? r.Stages
            : new List<CreateStageRequest> { new("Nova etapa", 0, null) };

        foreach (var s in payloadStages)
        {
            var stage = new PipelineStage
            {
                Name = string.IsNullOrWhiteSpace(s.Name) ? "Etapa" : s.Name.Trim(),
                Order = s.Order,
                AutoTasksJson = s.AutoTasksJson,
                Pipeline = pipeline
            };
            _db.PipelineStages.Add(stage);
            stages.Add(stage);
        }
        await _db.SaveChangesAsync();

        return Result<PipelineDto>.Created(new PipelineDto(pipeline.Id, pipeline.Name, pipeline.Order,
            stages.OrderBy(s => s.Order)
                  .Select(s => new PipelineStageDto(s.Id, s.Name, s.Order, s.AutoTasksJson, 0, 0))
                  .ToList()));
    }

    public async Task<Result<PipelineDto>> UpdatePipelineAsync(int id, UpdatePipelineRequest r)
    {
        var pipeline = await _db.Pipelines.Include(p => p.Stages).FirstOrDefaultAsync(p => p.Id == id);
        if (pipeline is null) return Result<PipelineDto>.NotFound();
        if (!string.IsNullOrWhiteSpace(r.Name)) pipeline.Name = r.Name.Trim();
        if (r.Order.HasValue) pipeline.Order = r.Order.Value;
        pipeline.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<PipelineDto>.Success(new PipelineDto(pipeline.Id, pipeline.Name, pipeline.Order,
            pipeline.Stages.OrderBy(s => s.Order)
                .Select(s => new PipelineStageDto(s.Id, s.Name, s.Order, s.AutoTasksJson, 0, 0))
                .ToList()));
    }

    public async Task<Result<bool>> DeletePipelineAsync(int id)
    {
        var pipeline = await _db.Pipelines.Include(p => p.Stages).FirstOrDefaultAsync(p => p.Id == id);
        if (pipeline is null) return Result<bool>.NotFound();

        // Guarda: não pode remover um pipeline que ainda tem negócios vinculados
        var hasDeals = await _db.Deals.AnyAsync(d => d.PipelineId == id);
        if (hasDeals)
            return Result<bool>.Failure(
                "Pipeline possui negócios. Mova ou remova-os antes de excluir.", 400);

        _db.PipelineStages.RemoveRange(pipeline.Stages);
        _db.Pipelines.Remove(pipeline);
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<PipelineStageDto>> AddStageAsync(int pipelineId, CreateStageRequest r)
    {
        var pipeline = await _db.Pipelines.FindAsync(pipelineId);
        if (pipeline is null) return Result<PipelineStageDto>.NotFound("Pipeline não encontrado");

        var stage = new PipelineStage
        {
            PipelineId = pipelineId,
            Name = r.Name.Trim(),
            Order = r.Order,
            AutoTasksJson = r.AutoTasksJson
        };
        _db.PipelineStages.Add(stage);
        await _db.SaveChangesAsync();

        return Result<PipelineStageDto>.Created(
            new PipelineStageDto(stage.Id, stage.Name, stage.Order, stage.AutoTasksJson, 0, 0));
    }

    public async Task<Result<PipelineStageDto>> UpdateStageAsync(int stageId, UpdateStageRequest r)
    {
        var stage = await _db.PipelineStages.FindAsync(stageId);
        if (stage is null) return Result<PipelineStageDto>.NotFound();
        if (!string.IsNullOrWhiteSpace(r.Name)) stage.Name = r.Name.Trim();
        if (r.Order.HasValue) stage.Order = r.Order.Value;
        if (r.AutoTasksJson is not null) stage.AutoTasksJson = r.AutoTasksJson;
        stage.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<PipelineStageDto>.Success(
            new PipelineStageDto(stage.Id, stage.Name, stage.Order, stage.AutoTasksJson, 0, 0));
    }

    public async Task<Result<bool>> DeleteStageAsync(int stageId)
    {
        var stage = await _db.PipelineStages.FindAsync(stageId);
        if (stage is null) return Result<bool>.NotFound();

        var hasDeals = await _db.Deals.AnyAsync(d => d.StageId == stageId);
        if (hasDeals)
            return Result<bool>.Failure(
                "Etapa possui negócios. Mova ou remova-os antes de excluir.", 400);

        _db.PipelineStages.Remove(stage);
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}
