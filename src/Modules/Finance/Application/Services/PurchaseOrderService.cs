using ERPlus.Modules.Finance.Domain.Entities;
using ERPlus.Modules.Finance.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Finance.Application.Services;

public class PurchaseOrderService
{
    private readonly FinanceDbContext _db;
    private static readonly HashSet<string> ValidStatuses = new()
    {
        "Rascunho", "Enviada", "Aprovada", "Recebida", "Cancelada"
    };

    public PurchaseOrderService(FinanceDbContext db) => _db = db;

    // Npgsql rejects DateTime with Kind=Unspecified when the column is
    // "timestamp with time zone". Requests coming from JSON get parsed
    // as Unspecified, so normalize to UTC before persisting.
    private static DateTime AsUtc(DateTime d) =>
        d.Kind == DateTimeKind.Utc ? d : DateTime.SpecifyKind(d.ToUniversalTime(), DateTimeKind.Utc);
    private static DateTime? AsUtc(DateTime? d) => d.HasValue ? AsUtc(d.Value) : null;

    public async Task<Result<List<PurchaseOrderDto>>> GetAllAsync(string? status)
    {
        var query = _db.PurchaseOrders.AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(p => p.Status == status);

        var pos = await query.OrderByDescending(p => p.Data).ToListAsync();
        var ccIds = pos.Where(p => p.CostCenterId.HasValue)
            .Select(p => p.CostCenterId!.Value).Distinct().ToList();
        var ccNames = await _db.CostCenters
            .Where(c => ccIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => c.Name);

        var items = pos.Select(p => new PurchaseOrderDto(
            p.Id, p.Numero, p.Titulo, p.FornecedorId,
            p.Data, p.PrazoEntrega, p.Valor, p.Status,
            p.CostCenterId,
            p.CostCenterId.HasValue && ccNames.TryGetValue(p.CostCenterId.Value, out var n) ? n : null,
            p.ResponsibleId, p.ItemsJson, p.Observacoes, p.AccountPayableId,
            p.CreatedAt)).ToList();

        return Result<List<PurchaseOrderDto>>.Success(items);
    }

    public async Task<Result<PurchaseOrderDto>> GetByIdAsync(int id)
    {
        var po = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == id);
        if (po is null) return Result<PurchaseOrderDto>.Failure("Ordem de compra não encontrada", 404);

        var cc = po.CostCenterId.HasValue
            ? await _db.CostCenters.FirstOrDefaultAsync(c => c.Id == po.CostCenterId.Value)
            : null;

        return Result<PurchaseOrderDto>.Success(new PurchaseOrderDto(
            po.Id, po.Numero, po.Titulo, po.FornecedorId,
            po.Data, po.PrazoEntrega, po.Valor, po.Status,
            po.CostCenterId, cc?.Name, po.ResponsibleId,
            po.ItemsJson, po.Observacoes, po.AccountPayableId,
            po.CreatedAt));
    }

    public async Task<Result<PurchaseOrderDto>> CreateAsync(CreatePurchaseOrderRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Titulo))
            return Result<PurchaseOrderDto>.Failure("Título é obrigatório", 400);
        if (req.Valor < 0)
            return Result<PurchaseOrderDto>.Failure("Valor não pode ser negativo", 400);

        var numero = await NextNumeroAsync();
        var po = new PurchaseOrder
        {
            Numero = numero,
            Titulo = req.Titulo,
            FornecedorId = req.FornecedorId,
            Data = req.Data == default ? DateTime.UtcNow : AsUtc(req.Data),
            PrazoEntrega = AsUtc(req.PrazoEntrega),
            Valor = req.Valor,
            Status = "Rascunho",
            CostCenterId = req.CostCenterId,
            ResponsibleId = req.ResponsibleId,
            ItemsJson = req.ItemsJson,
            Observacoes = req.Observacoes,
            CreatedAt = DateTime.UtcNow
        };
        _db.PurchaseOrders.Add(po);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(po.Id);
    }

    public async Task<Result<PurchaseOrderDto>> UpdateAsync(int id, UpdatePurchaseOrderRequest req)
    {
        var po = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == id);
        if (po is null) return Result<PurchaseOrderDto>.Failure("Ordem de compra não encontrada", 404);

        if (!string.IsNullOrEmpty(req.Status) && !ValidStatuses.Contains(req.Status))
            return Result<PurchaseOrderDto>.Failure(
                $"Status inválido. Valores aceitos: {string.Join(", ", ValidStatuses)}", 400);

        if (req.Titulo is not null) po.Titulo = req.Titulo;
        if (req.FornecedorId.HasValue) po.FornecedorId = req.FornecedorId;
        if (req.Data.HasValue) po.Data = AsUtc(req.Data.Value);
        if (req.PrazoEntrega.HasValue) po.PrazoEntrega = AsUtc(req.PrazoEntrega);
        if (req.Valor.HasValue) po.Valor = req.Valor.Value;
        if (!string.IsNullOrEmpty(req.Status)) po.Status = req.Status;
        if (req.CostCenterId.HasValue) po.CostCenterId = req.CostCenterId;
        if (req.ResponsibleId.HasValue) po.ResponsibleId = req.ResponsibleId;
        if (req.ItemsJson is not null) po.ItemsJson = req.ItemsJson;
        if (req.Observacoes is not null) po.Observacoes = req.Observacoes;
        po.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var po = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == id);
        if (po is null) return Result<bool>.Failure("Ordem de compra não encontrada", 404);

        po.IsDeleted = true;
        po.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    private async Task<string> NextNumeroAsync()
    {
        // Simple sequential OC-001, OC-002 ... based on count; unique constraint protects against races
        // across concurrent requests — caller will retry on conflict.
        var count = await _db.PurchaseOrders.IgnoreQueryFilters().CountAsync();
        return $"OC-{(count + 1):D3}";
    }
}
