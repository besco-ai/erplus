using ERPlus.Modules.Commercial.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Reports.Application;

public record CommercialDashboardDto(
    int TotalDeals,
    decimal TotalValue,
    int ActiveDeals,
    int WonDeals,
    int LostDeals,
    decimal AvgDealValue,
    int TotalQuotes,
    int ApprovedQuotes,
    int RejectedQuotes,
    int ConversionRate,
    decimal ApprovedQuotesValue,
    decimal TotalQuotesValue,
    int TotalContracts,
    int ActiveContracts,
    decimal ActiveContractsValue,
    List<FunnelItemDto> Funnel,
    List<PipelineSummaryDto> PipelineSummary,
    List<RecentDealDto> RecentDeals,
    List<TopClientDto> TopClients,
    List<StatusCountDto> QuotesByStatus,
    List<StatusCountDto> ContractsByStatus,
    List<StatusCountDto> DealsByStatus);

public record PipelineSummaryDto(string PipelineName, int DealsCount, decimal TotalValue);
public record RecentDealDto(int Id, string Title, string PipelineName, decimal Value, string Status);
public record TopClientDto(int ClientId, int DealsCount, decimal TotalValue);
public record StatusCountDto(string Status, int Count);

public class CommercialDashboardService
{
    private readonly CommercialDbContext _commercial;

    public CommercialDashboardService(CommercialDbContext commercial)
    {
        _commercial = commercial;
    }

    public async Task<Result<CommercialDashboardDto>> GetAsync()
    {
        var deals = await _commercial.Deals
            .Include(d => d.Pipeline)
            .Include(d => d.Stage)
            .ToListAsync();
        var quotes = await _commercial.Quotes.ToListAsync();
        var contracts = await _commercial.Contracts.ToListAsync();

        var activeDeals = deals.Where(d => d.DealStatus == "Ativo").ToList();
        var wonDeals    = deals.Count(d => d.DealStatus == "Ganho");
        var lostDeals   = deals.Count(d => d.DealStatus == "Perdido");

        var approvedQuotes      = quotes.Count(q => q.Status == "Aprovado");
        var rejectedQuotes      = quotes.Count(q => q.Status == "Recusado");
        var approvedQuotesValue = quotes.Where(q => q.Status == "Aprovado").Sum(q => q.Valor);
        var totalQuotesValue    = quotes.Sum(q => q.Valor);

        var pipelines = await _commercial.Pipelines
            .Include(p => p.Stages.OrderBy(s => s.Order))
            .OrderBy(p => p.Order)
            .ToListAsync();

        // Funil por etapa (apenas etapas com negócios ativos)
        var funnel = pipelines.SelectMany(pl =>
            pl.Stages.Select(st =>
            {
                var stDeals = activeDeals.Where(d => d.PipelineId == pl.Id && d.StageId == st.Id).ToList();
                return new FunnelItemDto(pl.Name, st.Name, stDeals.Count, stDeals.Sum(d => d.Value));
            })).Where(f => f.Count > 0).ToList();

        // Resumo por pipeline (todos os pipelines, incluindo com 0 negócios)
        var pipelineSummary = pipelines.Select(pl =>
        {
            var plDeals = activeDeals.Where(d => d.PipelineId == pl.Id).ToList();
            return new PipelineSummaryDto(pl.Name, plDeals.Count, plDeals.Sum(d => d.Value));
        }).ToList();

        // Últimos 5 negócios por data de criação
        var recentDeals = deals
            .OrderByDescending(d => d.Date)
            .Take(5)
            .Select(d => new RecentDealDto(
                d.Id,
                d.Title,
                d.Pipeline?.Name ?? "",
                d.Value,
                d.DealStatus))
            .ToList();

        var topClients = deals
            .GroupBy(d => d.ClientId)
            .Select(g => new TopClientDto(g.Key, g.Count(), g.Sum(d => d.Value)))
            .OrderByDescending(c => c.TotalValue)
            .Take(5)
            .ToList();

        var quotesByStatus = quotes
            .GroupBy(q => q.Status)
            .Select(g => new StatusCountDto(g.Key, g.Count()))
            .OrderByDescending(s => s.Count)
            .ToList();

        var contractsByStatus = contracts
            .GroupBy(c => c.Status)
            .Select(g => new StatusCountDto(g.Key, g.Count()))
            .OrderByDescending(s => s.Count)
            .ToList();

        var dealsByStatus = deals
            .GroupBy(d => d.DealStatus)
            .Select(g => new StatusCountDto(g.Key, g.Count()))
            .OrderByDescending(s => s.Count)
            .ToList();

        var activeContracts = contracts.Where(c => c.Status == "Vigente").ToList();
        var avgDealValue    = activeDeals.Count > 0 ? activeDeals.Average(d => d.Value) : 0;
        var conversionRate  = quotes.Count > 0 ? (int)Math.Round(approvedQuotes * 100.0 / quotes.Count) : 0;

        return Result<CommercialDashboardDto>.Success(new CommercialDashboardDto(
            deals.Count,
            activeDeals.Sum(d => d.Value),
            activeDeals.Count,
            wonDeals,
            lostDeals,
            avgDealValue,
            quotes.Count,
            approvedQuotes,
            rejectedQuotes,
            conversionRate,
            approvedQuotesValue,
            totalQuotesValue,
            contracts.Count,
            activeContracts.Count,
            activeContracts.Sum(c => c.Valor),
            funnel,
            pipelineSummary,
            recentDeals,
            topClients,
            quotesByStatus,
            contractsByStatus,
            dealsByStatus));
    }
}
