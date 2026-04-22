using ERPlus.Modules.Production.Domain.Entities;
using ERPlus.Modules.Production.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Production.Application.Services;

public class ProductionService
{
    private readonly ProductionDbContext _db;

    private static readonly Dictionary<string, string> CategoryLabels = new()
    {
        { "licenciamentos", "Licenciamentos" }, { "design", "Design Criativo" },
        { "projetos", "Projetos" }, { "revisao_tecnica", "Revisões Técnicas" },
        { "incorporacoes", "Incorporações" }, { "supervisao", "Supervisões" },
        { "vistorias", "Vistorias" }, { "averbacoes", "Averbações" }
    };

    private static readonly HashSet<string> ValidStatuses = new()
        { "Não iniciado", "Em andamento", "Em revisão", "Finalizado" };

    public ProductionService(ProductionDbContext db) => _db = db;

    public async Task<Result<List<ProductionSummaryDto>>> GetSummaryAsync()
    {
        var items = await _db.Items.ToListAsync();
        var result = CategoryLabels.Select(kv =>
        {
            var catItems = items.Where(i => i.Category == kv.Key).ToList();
            return new ProductionSummaryDto(kv.Key, kv.Value, catItems.Count,
                catItems.Count(i => i.Status == "Não iniciado"),
                catItems.Count(i => i.Status == "Em andamento"),
                catItems.Count(i => i.Status == "Finalizado"));
        }).ToList();
        return Result<List<ProductionSummaryDto>>.Success(result);
    }

    public async Task<Result<List<ProductionItemDto>>> GetAllAsync(string? category, string? status, int? responsibleId, int? projectId)
    {
        var query = _db.Items.Include(i => i.ProdItemType).AsQueryable();
        if (!string.IsNullOrEmpty(category)) query = query.Where(i => i.Category == category);
        if (!string.IsNullOrEmpty(status)) query = query.Where(i => i.Status == status);
        if (responsibleId.HasValue) query = query.Where(i => i.ResponsibleId == responsibleId.Value);
        if (projectId.HasValue) query = query.Where(i => i.ProjectId == projectId.Value);

        var today = DateTime.UtcNow.Date;
        var items = await query.OrderBy(i => i.Due ?? DateTime.MaxValue)
            .Select(i => new ProductionItemDto(
                i.Id, i.Title, i.Description, i.Category, i.Status,
                i.DealId, i.ProjectId, i.ClientId, i.ResponsibleId, i.Due,
                i.ProdItemTypeId, i.ProdItemType != null ? i.ProdItemType.Name : null,
                i.CreatedAt,
                i.Status != "Finalizado" && i.Due.HasValue && i.Due.Value.Date < today))
            .ToListAsync();
        return Result<List<ProductionItemDto>>.Success(items);
    }

    public async Task<Result<ProductionItemDto>> CreateAsync(CreateProductionItemRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Title)) return Result<ProductionItemDto>.Failure("Título é obrigatório");
        if (!CategoryLabels.ContainsKey(r.Category)) return Result<ProductionItemDto>.Failure("Categoria inválida");

        var item = new ProductionItem
        {
            Title = r.Title.Trim(), Description = r.Description?.Trim(),
            Category = r.Category, Status = "Não iniciado",
            ResponsibleId = r.ResponsibleId > 0 ? r.ResponsibleId : 1,
            Due = r.Due, DealId = r.DealId, ProjectId = r.ProjectId,
            ClientId = r.ClientId, ProdItemTypeId = r.ProdItemTypeId
        };
        _db.Items.Add(item);
        await _db.SaveChangesAsync();

        return Result<ProductionItemDto>.Created(new ProductionItemDto(
            item.Id, item.Title, item.Description, item.Category, item.Status,
            item.DealId, item.ProjectId, item.ClientId, item.ResponsibleId, item.Due,
            item.ProdItemTypeId, null, item.CreatedAt, false));
    }

    public async Task<Result<ProductionItemDto>> UpdateAsync(int id, UpdateProductionItemRequest r)
    {
        var item = await _db.Items.FindAsync(id);
        if (item is null) return Result<ProductionItemDto>.NotFound();

        if (r.Title is not null) item.Title = r.Title.Trim();
        if (r.Description is not null) item.Description = r.Description.Trim();
        if (r.Status is not null)
        {
            if (!ValidStatuses.Contains(r.Status)) return Result<ProductionItemDto>.Failure("Status inválido");
            item.Status = r.Status;
        }
        if (r.ResponsibleId.HasValue) item.ResponsibleId = r.ResponsibleId.Value;
        if (r.Due.HasValue) item.Due = r.Due.Value;
        if (r.Category is not null) item.Category = r.Category;
        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var today = DateTime.UtcNow.Date;
        return Result<ProductionItemDto>.Success(new ProductionItemDto(
            item.Id, item.Title, item.Description, item.Category, item.Status,
            item.DealId, item.ProjectId, item.ClientId, item.ResponsibleId, item.Due,
            item.ProdItemTypeId, null, item.CreatedAt,
            item.Status != "Finalizado" && item.Due.HasValue && item.Due.Value.Date < today));
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var item = await _db.Items.FindAsync(id);
        if (item is null) return Result<bool>.NotFound();
        item.IsDeleted = true; item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<List<ProductionItemTypeDto>>> GetItemTypesAsync(string? categoria)
    {
        var query = _db.ItemTypes.AsQueryable();
        if (!string.IsNullOrEmpty(categoria)) query = query.Where(t => t.Categoria == categoria);
        var types = await query.OrderBy(t => t.Name)
            .Select(t => new ProductionItemTypeDto(t.Id, t.Name, t.Categoria, t.Descricao, t.AutoTasksJson, t.Status))
            .ToListAsync();
        return Result<List<ProductionItemTypeDto>>.Success(types);
    }

    public async Task<Result<ProductionItemTypeDto>> CreateItemTypeAsync(CreateItemTypeRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Name)) return Result<ProductionItemTypeDto>.Failure("Nome é obrigatório");
        if (string.IsNullOrWhiteSpace(r.Categoria)) return Result<ProductionItemTypeDto>.Failure("Categoria é obrigatória");
        if (!CategoryLabels.ContainsKey(r.Categoria)) return Result<ProductionItemTypeDto>.Failure("Categoria inválida");

        var t = new ProductionItemType
        {
            Name = r.Name.Trim(),
            Categoria = r.Categoria,
            Descricao = r.Descricao?.Trim(),
            AutoTasksJson = r.AutoTasksJson
        };
        _db.ItemTypes.Add(t);
        await _db.SaveChangesAsync();
        return Result<ProductionItemTypeDto>.Created(new ProductionItemTypeDto(t.Id, t.Name, t.Categoria, t.Descricao, t.AutoTasksJson, t.Status));
    }

    public async Task<Result<ProductionItemTypeDto>> UpdateItemTypeAsync(int id, UpdateItemTypeRequest r)
    {
        var t = await _db.ItemTypes.FindAsync(id);
        if (t is null) return Result<ProductionItemTypeDto>.NotFound();

        if (r.Name is not null) t.Name = r.Name.Trim();
        if (r.Categoria is not null)
        {
            if (!CategoryLabels.ContainsKey(r.Categoria)) return Result<ProductionItemTypeDto>.Failure("Categoria inválida");
            t.Categoria = r.Categoria;
        }
        if (r.Descricao is not null) t.Descricao = r.Descricao.Trim();
        if (r.AutoTasksJson is not null) t.AutoTasksJson = r.AutoTasksJson;
        if (r.Status is not null) t.Status = r.Status;
        t.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Result<ProductionItemTypeDto>.Success(new ProductionItemTypeDto(t.Id, t.Name, t.Categoria, t.Descricao, t.AutoTasksJson, t.Status));
    }

    public async Task<Result<bool>> DeleteItemTypeAsync(int id)
    {
        var t = await _db.ItemTypes.FindAsync(id);
        if (t is null) return Result<bool>.NotFound();

        // Se algum ProductionItem usa esse tipo, não deletamos — só desativamos pra não quebrar vínculo histórico.
        var inUse = await _db.Items.AnyAsync(i => i.ProdItemTypeId == id);
        if (inUse)
        {
            t.Status = "Inativo";
            t.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Result<bool>.Success(true);
        }

        _db.ItemTypes.Remove(t);
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}
