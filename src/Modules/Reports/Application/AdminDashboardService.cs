using ERPlus.Modules.Finance.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Reports.Application;

public record AdminDashboardDto(
    decimal Receitas,
    decimal Despesas,
    decimal Saldo,
    decimal TotalAReceber,
    decimal TotalAPagar,
    int AReceberPendentes,
    int AReceberVencidos,
    int APagarPendentes,
    int APagarVencidos,
    decimal SaldoBancos,
    List<CostCenterSummaryDto> ReceitasByCostCenter,
    List<CostCenterSummaryDto> DespesasByCostCenter,
    List<MonthlyBalanceDto> LastMonths,
    List<UpcomingDto> ProximasReceber,
    List<UpcomingDto> ProximasPagar);

public record CostCenterSummaryDto(int CostCenterId, string Name, decimal Value);
public record MonthlyBalanceDto(string Month, decimal Receitas, decimal Despesas);
public record UpcomingDto(int Id, string Descricao, decimal Valor, DateTime Vencimento, string Status);

public class AdminDashboardService
{
    private readonly FinanceDbContext _finance;

    public AdminDashboardService(FinanceDbContext finance)
    {
        _finance = finance;
    }

    public async Task<Result<AdminDashboardDto>> GetAsync()
    {
        var today = DateTime.UtcNow.Date;
        var entries = await _finance.Entries.Include(e => e.CostCenter).ToListAsync();
        var receivables = await _finance.AccountsReceivable.ToListAsync();
        var payables = await _finance.AccountsPayable.ToListAsync();
        var accounts = await _finance.BankAccounts.ToListAsync();
        var costCenters = await _finance.CostCenters.ToListAsync();

        var receitasEfetuadas = entries.Where(e => e.Type == "receita" && e.Status == "Efetuado").Sum(e => e.Value);
        var despesasEfetuadas = entries.Where(e => e.Type == "despesa" && e.Status == "Efetuado").Sum(e => e.Value);

        var arPendentes = receivables.Where(r => r.Status == "Em aberto").ToList();
        var apPendentes = payables.Where(p => p.Status == "Em aberto").ToList();

        var arVencidos = arPendentes.Count(r => r.Vencimento.Date < today);
        var apVencidos = apPendentes.Count(p => p.Vencimento.Date < today);

        var receitasByCc = entries
            .Where(e => e.Type == "receita" && e.Status == "Efetuado")
            .GroupBy(e => e.CostCenterId)
            .Select(g =>
            {
                var cc = costCenters.FirstOrDefault(c => c.Id == g.Key);
                return new CostCenterSummaryDto(g.Key, cc?.Name ?? $"CC #{g.Key}", g.Sum(e => e.Value));
            })
            .OrderByDescending(x => x.Value)
            .ToList();

        var despesasByCc = entries
            .Where(e => e.Type == "despesa" && e.Status == "Efetuado")
            .GroupBy(e => e.CostCenterId)
            .Select(g =>
            {
                var cc = costCenters.FirstOrDefault(c => c.Id == g.Key);
                return new CostCenterSummaryDto(g.Key, cc?.Name ?? $"CC #{g.Key}", g.Sum(e => e.Value));
            })
            .OrderByDescending(x => x.Value)
            .ToList();

        // Last 6 months
        var lastMonths = new List<MonthlyBalanceDto>();
        for (var i = 5; i >= 0; i--)
        {
            var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-i);
            var monthEnd = monthStart.AddMonths(1);
            var mReceitas = entries
                .Where(e => e.Type == "receita" && e.Status == "Efetuado" && e.Date >= monthStart && e.Date < monthEnd)
                .Sum(e => e.Value);
            var mDespesas = entries
                .Where(e => e.Type == "despesa" && e.Status == "Efetuado" && e.Date >= monthStart && e.Date < monthEnd)
                .Sum(e => e.Value);
            lastMonths.Add(new MonthlyBalanceDto(monthStart.ToString("yyyy-MM"), mReceitas, mDespesas));
        }

        var proximasReceber = arPendentes
            .OrderBy(r => r.Vencimento)
            .Take(5)
            .Select(r => new UpcomingDto(r.Id, r.Descricao, r.Valor, r.Vencimento, r.Status))
            .ToList();

        var proximasPagar = apPendentes
            .OrderBy(p => p.Vencimento)
            .Take(5)
            .Select(p => new UpcomingDto(p.Id, p.Descricao, p.Valor, p.Vencimento, p.Status))
            .ToList();

        return Result<AdminDashboardDto>.Success(new AdminDashboardDto(
            receitasEfetuadas,
            despesasEfetuadas,
            receitasEfetuadas - despesasEfetuadas,
            arPendentes.Sum(r => r.Valor),
            apPendentes.Sum(p => p.Valor),
            arPendentes.Count,
            arVencidos,
            apPendentes.Count,
            apVencidos,
            accounts.Sum(a => a.Balance),
            receitasByCc,
            despesasByCc,
            lastMonths,
            proximasReceber,
            proximasPagar));
    }
}
