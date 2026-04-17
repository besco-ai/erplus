using ERPlus.Modules.Commercial.Domain.Entities;
using ERPlus.Modules.Commercial.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Commercial.Application.Services;

// ══ Contracts ══
public class ContractService
{
    private readonly CommercialDbContext _db;
    public ContractService(CommercialDbContext db) => _db = db;

    public async Task<Result<List<ContractDto>>> GetAllAsync(int? dealId)
    {
        var query = _db.Contracts.AsQueryable();
        if (dealId.HasValue) query = query.Where(c => c.DealId == dealId.Value);

        var contracts = await query.OrderByDescending(c => c.DataInicio)
            .Select(c => new ContractDto(c.Id, c.Numero, c.QuoteId, c.DealId, c.ClientId,
                c.Titulo, c.Valor, c.Status, c.DataInicio, c.DataFim, c.ResponsibleId,
                c.Registro, c.InscricaoImob, c.EndEmpreendimento, c.BusinessTypeId))
            .ToListAsync();
        return Result<List<ContractDto>>.Success(contracts);
    }

    public async Task<Result<ContractDto>> CreateAsync(CreateContractRequest r)
    {
        var deal = await _db.Deals.FindAsync(r.DealId);
        if (deal is null) return Result<ContractDto>.Failure("Negócio não encontrado");

        var maxNum = await _db.Contracts.MaxAsync(c => (int?)c.Id) ?? 0;
        var contract = new Contract
        {
            Numero = $"CTR-{(maxNum + 1):D3}",
            DealId = r.DealId,
            ClientId = r.ClientId,
            Titulo = r.Titulo.Trim(),
            Valor = r.Valor,
            Status = "Vigente",
            DataInicio = DateTime.UtcNow,
            DataFim = r.DataFim,
            ResponsibleId = r.ResponsibleId,
            QuoteId = r.QuoteId,
            Registro = deal.Registro,
            InscricaoImob = deal.InscricaoImob,
            EndEmpreendimento = deal.EndEmpreendimento,
            BusinessTypeId = deal.BusinessTypeId
        };
        _db.Contracts.Add(contract);
        await _db.SaveChangesAsync();

        return Result<ContractDto>.Created(new ContractDto(
            contract.Id, contract.Numero, contract.QuoteId, contract.DealId, contract.ClientId,
            contract.Titulo, contract.Valor, contract.Status, contract.DataInicio, contract.DataFim,
            contract.ResponsibleId, contract.Registro, contract.InscricaoImob,
            contract.EndEmpreendimento, contract.BusinessTypeId));
    }
}

// ══ Atas ══
public class AtaService
{
    private readonly CommercialDbContext _db;
    public AtaService(CommercialDbContext db) => _db = db;

    public async Task<Result<DealAtaDto>> CreateAsync(int dealId, CreateAtaRequest r)
    {
        if (!await _db.Deals.AnyAsync(d => d.Id == dealId))
            return Result<DealAtaDto>.NotFound("Negócio não encontrado");

        var ata = new DealAta
        {
            DealId = dealId,
            Title = r.Title.Trim(),
            Date = DateTime.UtcNow,
            Content = r.Content?.Trim() ?? "",
            LinksJson = r.LinksJson
        };
        _db.DealAtas.Add(ata);
        await _db.SaveChangesAsync();

        return Result<DealAtaDto>.Created(new DealAtaDto(ata.Id, ata.DealId, ata.Title, ata.Date, ata.Content, ata.LinksJson));
    }

    public async Task<Result<bool>> DeleteAsync(int dealId, int ataId)
    {
        var ata = await _db.DealAtas.FirstOrDefaultAsync(a => a.Id == ataId && a.DealId == dealId);
        if (ata is null) return Result<bool>.NotFound();
        _db.DealAtas.Remove(ata);
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}

// ══ Diligence ══
public class DiligenceService
{
    private readonly CommercialDbContext _db;
    public DiligenceService(CommercialDbContext db) => _db = db;

    public async Task<Result<DealDiligenceDto>> LoadAsync(int dealId, LoadDiligenceRequest r)
    {
        var template = await _db.DiligenceTemplates.FindAsync(r.TemplateId);
        if (template is null) return Result<DealDiligenceDto>.NotFound("Template não encontrado");

        var diligence = new DealDiligence
        {
            DealId = dealId,
            TemplateId = r.TemplateId,
            ItemsJson = template.ItemsJson
        };
        _db.DealDiligences.Add(diligence);
        await _db.SaveChangesAsync();

        return Result<DealDiligenceDto>.Created(new DealDiligenceDto(
            diligence.Id, dealId, r.TemplateId, template.Name, diligence.ItemsJson));
    }

    public async Task<Result<bool>> UpdateItemsAsync(int dealId, int diligenceId, UpdateDiligenceItemsRequest r)
    {
        var dil = await _db.DealDiligences.FirstOrDefaultAsync(d => d.Id == diligenceId && d.DealId == dealId);
        if (dil is null) return Result<bool>.NotFound();
        dil.ItemsJson = r.ItemsJson;
        dil.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<List<DiligenceTemplateDto>>> GetTemplatesAsync()
    {
        var templates = await _db.DiligenceTemplates.OrderBy(t => t.Name)
            .Select(t => new DiligenceTemplateDto(t.Id, t.Name, t.BusinessTypeId, t.ItemsJson))
            .ToListAsync();
        return Result<List<DiligenceTemplateDto>>.Success(templates);
    }

    public async Task<Result<DealBriefingDto>> LoadBriefingAsync(int dealId, LoadBriefingRequest r)
    {
        var template = await _db.BriefingTemplates.FindAsync(r.TemplateId);
        if (template is null) return Result<DealBriefingDto>.NotFound("Template não encontrado");

        var briefing = new DealBriefing
        {
            DealId = dealId,
            TemplateId = r.TemplateId,
            ItemsJson = template.ItemsJson
        };
        _db.DealBriefings.Add(briefing);
        await _db.SaveChangesAsync();

        return Result<DealBriefingDto>.Created(new DealBriefingDto(
            briefing.Id, dealId, r.TemplateId, template.Name, briefing.ItemsJson));
    }

    public async Task<Result<List<BriefingTemplateDto>>> GetBriefingTemplatesAsync()
    {
        var templates = await _db.BriefingTemplates.OrderBy(t => t.Name)
            .Select(t => new BriefingTemplateDto(t.Id, t.Name, t.ItemsJson))
            .ToListAsync();
        return Result<List<BriefingTemplateDto>>.Success(templates);
    }
}
