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

    public async Task<Result<List<ContractDto>>> GetAllAsync(int? dealId, int? clientId = null)
    {
        var query = _db.Contracts.AsQueryable();
        if (dealId.HasValue) query = query.Where(c => c.DealId == dealId.Value);
        if (clientId.HasValue) query = query.Where(c => c.ClientId == clientId.Value);

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

    public async Task<Result<List<DealAtaDto>>> GetByDealAsync(int dealId)
    {
        var atas = await _db.DealAtas
            .Where(a => a.DealId == dealId)
            .OrderByDescending(a => a.Date)
            .Select(a => new DealAtaDto(a.Id, a.DealId, a.Title, a.Date, a.Content, a.LinksJson))
            .ToListAsync();
        return Result<List<DealAtaDto>>.Success(atas);
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

    // ── GETs por deal ──

    public async Task<Result<List<DealDiligenceDto>>> GetDiligencesByDealAsync(int dealId)
    {
        var list = await _db.DealDiligences.Where(d => d.DealId == dealId)
            .Join(_db.DiligenceTemplates, d => d.TemplateId, t => t.Id,
                (d, t) => new DealDiligenceDto(d.Id, d.DealId, d.TemplateId, t.Name, d.ItemsJson))
            .ToListAsync();
        return Result<List<DealDiligenceDto>>.Success(list);
    }

    public async Task<Result<List<DealBriefingDto>>> GetBriefingsByDealAsync(int dealId)
    {
        var list = await _db.DealBriefings.Where(b => b.DealId == dealId)
            .Join(_db.BriefingTemplates, b => b.TemplateId, t => t.Id,
                (b, t) => new DealBriefingDto(b.Id, b.DealId, b.TemplateId, t.Name, b.ItemsJson))
            .ToListAsync();
        return Result<List<DealBriefingDto>>.Success(list);
    }

    public async Task<Result<bool>> UpdateBriefingItemsAsync(int dealId, int briefingId, UpdateBriefingItemsRequest r)
    {
        var b = await _db.DealBriefings.FirstOrDefaultAsync(x => x.Id == briefingId && x.DealId == dealId);
        if (b is null) return Result<bool>.NotFound();
        if (r.ItemsJson is not null) b.ItemsJson = r.ItemsJson;
        b.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    // ── CRUD de DiligenceTemplate ──

    public async Task<Result<DiligenceTemplateDto>> CreateTemplateAsync(CreateDiligenceTemplateRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Name))
            return Result<DiligenceTemplateDto>.Failure("Nome é obrigatório");
        var t = new DiligenceTemplate { Name = r.Name.Trim(), BusinessTypeId = r.BusinessTypeId, ItemsJson = r.ItemsJson };
        _db.DiligenceTemplates.Add(t);
        await _db.SaveChangesAsync();
        return Result<DiligenceTemplateDto>.Created(new DiligenceTemplateDto(t.Id, t.Name, t.BusinessTypeId, t.ItemsJson));
    }

    public async Task<Result<DiligenceTemplateDto>> UpdateTemplateAsync(int id, UpdateDiligenceTemplateRequest r)
    {
        var t = await _db.DiligenceTemplates.FindAsync(id);
        if (t is null) return Result<DiligenceTemplateDto>.NotFound();
        if (r.Name is not null) t.Name = r.Name.Trim();
        if (r.BusinessTypeId.HasValue) t.BusinessTypeId = r.BusinessTypeId;
        if (r.ItemsJson is not null) t.ItemsJson = r.ItemsJson;
        t.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<DiligenceTemplateDto>.Success(new DiligenceTemplateDto(t.Id, t.Name, t.BusinessTypeId, t.ItemsJson));
    }

    public async Task<Result<bool>> DeleteTemplateAsync(int id)
    {
        var t = await _db.DiligenceTemplates.FindAsync(id);
        if (t is null) return Result<bool>.NotFound();
        _db.DiligenceTemplates.Remove(t);
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    // ── CRUD de BriefingTemplate ──

    public async Task<Result<BriefingTemplateDto>> CreateBriefingTemplateAsync(CreateBriefingTemplateRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Name))
            return Result<BriefingTemplateDto>.Failure("Nome é obrigatório");
        var t = new BriefingTemplate { Name = r.Name.Trim(), ItemsJson = r.ItemsJson };
        _db.BriefingTemplates.Add(t);
        await _db.SaveChangesAsync();
        return Result<BriefingTemplateDto>.Created(new BriefingTemplateDto(t.Id, t.Name, t.ItemsJson));
    }

    public async Task<Result<BriefingTemplateDto>> UpdateBriefingTemplateAsync(int id, UpdateBriefingTemplateRequest r)
    {
        var t = await _db.BriefingTemplates.FindAsync(id);
        if (t is null) return Result<BriefingTemplateDto>.NotFound();
        if (r.Name is not null) t.Name = r.Name.Trim();
        if (r.ItemsJson is not null) t.ItemsJson = r.ItemsJson;
        t.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<BriefingTemplateDto>.Success(new BriefingTemplateDto(t.Id, t.Name, t.ItemsJson));
    }

    public async Task<Result<bool>> DeleteBriefingTemplateAsync(int id)
    {
        var t = await _db.BriefingTemplates.FindAsync(id);
        if (t is null) return Result<bool>.NotFound();
        _db.BriefingTemplates.Remove(t);
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}
