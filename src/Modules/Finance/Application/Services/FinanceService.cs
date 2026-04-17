using ERPlus.Modules.Finance.Domain.Entities;
using ERPlus.Modules.Finance.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Finance.Application.Services;

public class FinanceService
{
    private readonly FinanceDbContext _db;
    private static readonly HashSet<string> ValidEntryTypes = new() { "receita", "despesa" };
    private static readonly HashSet<string> ValidStatuses = new() { "Em aberto", "Efetuado", "Vencido" };

    public FinanceService(FinanceDbContext db) => _db = db;

    // ══ Summary ══
    public async Task<Result<FinanceSummaryDto>> GetSummaryAsync()
    {
        var entries = await _db.Entries.ToListAsync();
        var receivables = await _db.AccountsReceivable.ToListAsync();
        var payables = await _db.AccountsPayable.ToListAsync();
        var today = DateTime.UtcNow.Date;

        var totalReceitas = entries.Where(e => e.Type == "receita" && e.Status == "Efetuado").Sum(e => e.Value);
        var totalDespesas = entries.Where(e => e.Type == "despesa" && e.Status == "Efetuado").Sum(e => e.Value);
        var aReceber = receivables.Where(r => r.Status == "Em aberto").Sum(r => r.Valor);
        var aPagar = payables.Where(p => p.Status == "Em aberto").Sum(p => p.Valor);
        var vencidas = receivables.Count(r => r.Status == "Em aberto" && r.Vencimento < today)
                     + payables.Count(p => p.Status == "Em aberto" && p.Vencimento < today);

        return Result<FinanceSummaryDto>.Success(new FinanceSummaryDto(
            totalReceitas, totalDespesas, totalReceitas - totalDespesas,
            aReceber, aPagar, vencidas));
    }

    // ══ Entries (Lançamentos) ══
    public async Task<Result<List<FinancialEntryDto>>> GetEntriesAsync(string? type, string? status, int? costCenterId)
    {
        var query = _db.Entries.Include(e => e.CostCenter).Include(e => e.Account).AsQueryable();
        if (!string.IsNullOrEmpty(type)) query = query.Where(e => e.Type == type);
        if (!string.IsNullOrEmpty(status)) query = query.Where(e => e.Status == status);
        if (costCenterId.HasValue) query = query.Where(e => e.CostCenterId == costCenterId.Value);

        var items = await query.OrderByDescending(e => e.Date)
            .Select(e => new FinancialEntryDto(
                e.Id, e.Type, e.Date, e.Description, e.ClientId,
                e.CostCenterId, e.CostCenter.Name, e.AccountId, e.Account.Name,
                e.Value, e.Status, e.CreatedAt))
            .ToListAsync();

        return Result<List<FinancialEntryDto>>.Success(items);
    }

    public async Task<Result<FinancialEntryDto>> CreateEntryAsync(CreateEntryRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Description))
            return Result<FinancialEntryDto>.Failure("Descrição é obrigatória");
        if (!ValidEntryTypes.Contains(r.Type))
            return Result<FinancialEntryDto>.Failure("Tipo deve ser 'receita' ou 'despesa'");
        if (r.Value <= 0)
            return Result<FinancialEntryDto>.Failure("Valor deve ser maior que zero");

        var entry = new FinancialEntry
        {
            Type = r.Type,
            Date = r.Date,
            Description = r.Description.Trim(),
            ClientId = r.ClientId,
            CostCenterId = r.CostCenterId,
            AccountId = r.AccountId,
            Value = r.Value,
            Status = r.Status ?? "Em aberto"
        };

        _db.Entries.Add(entry);
        await _db.SaveChangesAsync();

        var cc = await _db.CostCenters.FindAsync(entry.CostCenterId);
        var acc = await _db.BankAccounts.FindAsync(entry.AccountId);

        return Result<FinancialEntryDto>.Created(new FinancialEntryDto(
            entry.Id, entry.Type, entry.Date, entry.Description, entry.ClientId,
            entry.CostCenterId, cc?.Name, entry.AccountId, acc?.Name,
            entry.Value, entry.Status, entry.CreatedAt));
    }

    public async Task<Result<FinancialEntryDto>> UpdateEntryAsync(int id, UpdateEntryRequest r)
    {
        var entry = await _db.Entries.Include(e => e.CostCenter).Include(e => e.Account).FirstOrDefaultAsync(e => e.Id == id);
        if (entry is null) return Result<FinancialEntryDto>.NotFound();

        if (r.Type is not null) { if (!ValidEntryTypes.Contains(r.Type)) return Result<FinancialEntryDto>.Failure("Tipo inválido"); entry.Type = r.Type; }
        if (r.Date.HasValue) entry.Date = r.Date.Value;
        if (r.Description is not null) entry.Description = r.Description.Trim();
        if (r.ClientId.HasValue) entry.ClientId = r.ClientId;
        if (r.CostCenterId.HasValue) entry.CostCenterId = r.CostCenterId.Value;
        if (r.AccountId.HasValue) entry.AccountId = r.AccountId.Value;
        if (r.Value.HasValue) entry.Value = r.Value.Value;
        if (r.Status is not null) { if (!ValidStatuses.Contains(r.Status)) return Result<FinancialEntryDto>.Failure("Status inválido"); entry.Status = r.Status; }

        entry.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<FinancialEntryDto>.Success(new FinancialEntryDto(
            entry.Id, entry.Type, entry.Date, entry.Description, entry.ClientId,
            entry.CostCenterId, entry.CostCenter.Name, entry.AccountId, entry.Account.Name,
            entry.Value, entry.Status, entry.CreatedAt));
    }

    public async Task<Result<bool>> DeleteEntryAsync(int id)
    {
        var entry = await _db.Entries.FindAsync(id);
        if (entry is null) return Result<bool>.NotFound();
        entry.IsDeleted = true;
        entry.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    // ══ Contas a Receber ══
    public async Task<Result<List<AccountReceivableDto>>> GetReceivablesAsync(string? status)
    {
        var query = _db.AccountsReceivable.AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(r => r.Status == status);

        var items = await query.OrderBy(r => r.Vencimento)
            .Select(r => new AccountReceivableDto(
                r.Id, r.Descricao, r.ClientId, r.Valor, r.Vencimento,
                r.Status, r.CostCenterId, null, r.ContractId, r.Observacoes, r.CreatedAt))
            .ToListAsync();

        return Result<List<AccountReceivableDto>>.Success(items);
    }

    public async Task<Result<AccountReceivableDto>> CreateReceivableAsync(CreateReceivableRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Descricao)) return Result<AccountReceivableDto>.Failure("Descrição é obrigatória");
        if (r.Valor <= 0) return Result<AccountReceivableDto>.Failure("Valor deve ser maior que zero");

        var item = new AccountReceivable
        {
            Descricao = r.Descricao.Trim(), ClientId = r.ClientId, Valor = r.Valor,
            Vencimento = r.Vencimento, CostCenterId = r.CostCenterId,
            ContractId = r.ContractId, Observacoes = r.Observacoes
        };
        _db.AccountsReceivable.Add(item);
        await _db.SaveChangesAsync();

        return Result<AccountReceivableDto>.Created(new AccountReceivableDto(
            item.Id, item.Descricao, item.ClientId, item.Valor, item.Vencimento,
            item.Status, item.CostCenterId, null, item.ContractId, item.Observacoes, item.CreatedAt));
    }

    public async Task<Result<bool>> UpdateReceivableAsync(int id, UpdateReceivableRequest r)
    {
        var item = await _db.AccountsReceivable.FindAsync(id);
        if (item is null) return Result<bool>.NotFound();
        if (r.Descricao is not null) item.Descricao = r.Descricao.Trim();
        if (r.Valor.HasValue) item.Valor = r.Valor.Value;
        if (r.Vencimento.HasValue) item.Vencimento = r.Vencimento.Value;
        if (r.Status is not null) item.Status = r.Status;
        if (r.Observacoes is not null) item.Observacoes = r.Observacoes;
        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> DeleteReceivableAsync(int id)
    {
        var item = await _db.AccountsReceivable.FindAsync(id);
        if (item is null) return Result<bool>.NotFound();
        item.IsDeleted = true; item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    // ══ Contas a Pagar ══
    public async Task<Result<List<AccountPayableDto>>> GetPayablesAsync(string? status)
    {
        var query = _db.AccountsPayable.AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(p => p.Status == status);

        var items = await query.OrderBy(p => p.Vencimento)
            .Select(p => new AccountPayableDto(
                p.Id, p.Descricao, p.ClientId, p.FornecedorId, p.Valor, p.Vencimento,
                p.Status, p.CostCenterId, null, p.Observacoes, p.CreatedAt))
            .ToListAsync();

        return Result<List<AccountPayableDto>>.Success(items);
    }

    public async Task<Result<AccountPayableDto>> CreatePayableAsync(CreatePayableRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Descricao)) return Result<AccountPayableDto>.Failure("Descrição é obrigatória");
        if (r.Valor <= 0) return Result<AccountPayableDto>.Failure("Valor deve ser maior que zero");

        var item = new AccountPayable
        {
            Descricao = r.Descricao.Trim(), FornecedorId = r.FornecedorId, Valor = r.Valor,
            Vencimento = r.Vencimento, CostCenterId = r.CostCenterId, Observacoes = r.Observacoes
        };
        _db.AccountsPayable.Add(item);
        await _db.SaveChangesAsync();

        return Result<AccountPayableDto>.Created(new AccountPayableDto(
            item.Id, item.Descricao, item.ClientId, item.FornecedorId, item.Valor,
            item.Vencimento, item.Status, item.CostCenterId, null, item.Observacoes, item.CreatedAt));
    }

    public async Task<Result<bool>> UpdatePayableAsync(int id, UpdatePayableRequest r)
    {
        var item = await _db.AccountsPayable.FindAsync(id);
        if (item is null) return Result<bool>.NotFound();
        if (r.Descricao is not null) item.Descricao = r.Descricao.Trim();
        if (r.Valor.HasValue) item.Valor = r.Valor.Value;
        if (r.Vencimento.HasValue) item.Vencimento = r.Vencimento.Value;
        if (r.Status is not null) item.Status = r.Status;
        if (r.Observacoes is not null) item.Observacoes = r.Observacoes;
        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> DeletePayableAsync(int id)
    {
        var item = await _db.AccountsPayable.FindAsync(id);
        if (item is null) return Result<bool>.NotFound();
        item.IsDeleted = true; item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    // ══ Cost Centers ══
    public async Task<Result<List<CostCenterDto>>> GetCostCentersAsync()
    {
        var items = await _db.CostCenters.OrderBy(c => c.Name)
            .Select(c => new CostCenterDto(c.Id, c.Name, c.Type, c.Category, c.Description, c.Status))
            .ToListAsync();
        return Result<List<CostCenterDto>>.Success(items);
    }

    public async Task<Result<CostCenterDto>> CreateCostCenterAsync(CreateCostCenterRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Name)) return Result<CostCenterDto>.Failure("Nome é obrigatório");
        var cc = new CostCenter { Name = r.Name.Trim(), Type = r.Type, Category = r.Category?.Trim(), Description = r.Description?.Trim() };
        _db.CostCenters.Add(cc);
        await _db.SaveChangesAsync();
        return Result<CostCenterDto>.Created(new CostCenterDto(cc.Id, cc.Name, cc.Type, cc.Category, cc.Description, cc.Status));
    }

    // ══ Bank Accounts ══
    public async Task<Result<List<BankAccountDto>>> GetBankAccountsAsync()
    {
        var items = await _db.BankAccounts.OrderBy(a => a.Name)
            .Select(a => new BankAccountDto(a.Id, a.Name, a.Balance))
            .ToListAsync();
        return Result<List<BankAccountDto>>.Success(items);
    }

    public async Task<Result<BankAccountDto>> CreateBankAccountAsync(CreateBankAccountRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Name)) return Result<BankAccountDto>.Failure("Nome é obrigatório");
        var acc = new BankAccount { Name = r.Name.Trim(), Balance = r.Balance };
        _db.BankAccounts.Add(acc);
        await _db.SaveChangesAsync();
        return Result<BankAccountDto>.Created(new BankAccountDto(acc.Id, acc.Name, acc.Balance));
    }
}
