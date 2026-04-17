using ERPlus.Modules.Commercial.Domain.Entities;
using ERPlus.Modules.Commercial.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Commercial.Application.Services;

public class DealService
{
    private readonly CommercialDbContext _db;

    public DealService(CommercialDbContext db) => _db = db;

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

        deal.StageId = r.StageId;
        if (r.PipelineId.HasValue) deal.PipelineId = r.PipelineId.Value;
        deal.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> WinAsync(int id)
    {
        var deal = await _db.Deals.FindAsync(id);
        if (deal is null) return Result<bool>.NotFound();

        deal.DealStatus = "Ganho";
        deal.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> LoseAsync(int id)
    {
        var deal = await _db.Deals.FindAsync(id);
        if (deal is null) return Result<bool>.NotFound();

        deal.DealStatus = "Perdido";
        deal.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<bool>.Success(true);
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
        var stage = new PipelineStage { Name = "Nova etapa", Order = 0, Pipeline = pipeline };
        _db.Pipelines.Add(pipeline);
        _db.PipelineStages.Add(stage);
        await _db.SaveChangesAsync();

        return Result<PipelineDto>.Created(new PipelineDto(pipeline.Id, pipeline.Name, pipeline.Order,
            new List<PipelineStageDto> { new(stage.Id, stage.Name, 0, null, 0, 0) }));
    }

    public async Task<Result<PipelineStageDto>> AddStageAsync(int pipelineId, CreateStageRequest r)
    {
        var pipeline = await _db.Pipelines.FindAsync(pipelineId);
        if (pipeline is null) return Result<PipelineStageDto>.NotFound("Pipeline não encontrado");

        var stage = new PipelineStage { PipelineId = pipelineId, Name = r.Name.Trim(), Order = r.Order };
        _db.PipelineStages.Add(stage);
        await _db.SaveChangesAsync();

        return Result<PipelineStageDto>.Created(new PipelineStageDto(stage.Id, stage.Name, stage.Order, null, 0, 0));
    }
}
