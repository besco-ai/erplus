using ERPlus.Modules.Production.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Reports.Application;

public record ProductionDashboardDto(
    int TotalItems,
    int FinishedItems,
    int InProgressItems,
    int NotStartedItems,
    int OverdueItems,
    List<CategoryStatsDto> ByCategory,
    List<StatusCountDto> ByStatus,
    List<ProductionItemSummaryDto> Overdue);

public record CategoryStatsDto(
    string Category,
    int Total,
    int Done,
    int InProgress,
    int NotStarted,
    int Overdue);

public record ProductionItemSummaryDto(
    int Id,
    string Title,
    string Category,
    string Status,
    DateTime? Due,
    int ResponsibleId);

public class ProductionDashboardService
{
    private readonly ProductionDbContext _production;

    public ProductionDashboardService(ProductionDbContext production)
    {
        _production = production;
    }

    public async Task<Result<ProductionDashboardDto>> GetAsync()
    {
        var today = DateTime.UtcNow.Date;
        var items = await _production.Items.ToListAsync();

        var finished = items.Count(i => i.Status == "Finalizado");
        var inProgress = items.Count(i => i.Status == "Em andamento" || i.Status == "Em revisão");
        var notStarted = items.Count(i => i.Status == "Não iniciado");
        var overdue = items
            .Where(i => i.Due.HasValue && i.Due.Value.Date < today && i.Status != "Finalizado")
            .ToList();

        var byCategory = items
            .GroupBy(i => i.Category)
            .Select(g => new CategoryStatsDto(
                g.Key,
                g.Count(),
                g.Count(i => i.Status == "Finalizado"),
                g.Count(i => i.Status == "Em andamento" || i.Status == "Em revisão"),
                g.Count(i => i.Status == "Não iniciado"),
                g.Count(i => i.Due.HasValue && i.Due.Value.Date < today && i.Status != "Finalizado")))
            .OrderByDescending(c => c.Total)
            .ToList();

        var byStatus = items
            .GroupBy(i => i.Status)
            .Select(g => new StatusCountDto(g.Key, g.Count()))
            .OrderByDescending(s => s.Count)
            .ToList();

        var overdueList = overdue
            .OrderBy(i => i.Due)
            .Take(10)
            .Select(i => new ProductionItemSummaryDto(
                i.Id, i.Title, i.Category, i.Status, i.Due, i.ResponsibleId))
            .ToList();

        return Result<ProductionDashboardDto>.Success(new ProductionDashboardDto(
            items.Count,
            finished,
            inProgress,
            notStarted,
            overdue.Count,
            byCategory,
            byStatus,
            overdueList));
    }
}
