using ERPlus.Modules.Documents.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Reports.Application;

public record SupportDashboardDto(
    int TotalTickets,
    int OpenTickets,
    int InProgressTickets,
    int ResolvedTickets,
    int UrgentOpen,
    List<StatusCountDto> ByStatus,
    List<StatusCountDto> ByPriority,
    List<StatusCountDto> ByCategory,
    double? AvgResolutionDays,
    List<TicketSummaryDto> RecentOpen);

public record TicketSummaryDto(
    int Id,
    string Title,
    string Category,
    string Priority,
    string Status,
    DateTime CreatedAt);

public class SupportDashboardService
{
    private readonly DocumentsDbContext _documents;

    public SupportDashboardService(DocumentsDbContext documents)
    {
        _documents = documents;
    }

    public async Task<Result<SupportDashboardDto>> GetAsync()
    {
        var tickets = await _documents.Tickets.ToListAsync();

        var open = tickets.Count(t => t.Status == "Aberto");
        var inProgress = tickets.Count(t => t.Status == "Em andamento");
        var resolved = tickets.Count(t => t.Status == "Resolvido" || t.Status == "Fechado");

        var urgentOpen = tickets.Count(t =>
            (t.Status == "Aberto" || t.Status == "Em andamento") &&
            t.Priority == "Urgente");

        var byStatus = tickets
            .GroupBy(t => t.Status)
            .Select(g => new StatusCountDto(g.Key, g.Count()))
            .OrderByDescending(s => s.Count)
            .ToList();

        var byPriority = tickets
            .GroupBy(t => t.Priority)
            .Select(g => new StatusCountDto(g.Key, g.Count()))
            .OrderByDescending(s => s.Count)
            .ToList();

        var byCategory = tickets
            .GroupBy(t => t.Category)
            .Select(g => new StatusCountDto(g.Key, g.Count()))
            .OrderByDescending(s => s.Count)
            .ToList();

        var resolvedWithDate = tickets
            .Where(t => t.ResolvedAt.HasValue)
            .ToList();
        double? avgDays = null;
        if (resolvedWithDate.Count > 0)
        {
            avgDays = resolvedWithDate.Average(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalDays);
            avgDays = Math.Round(avgDays.Value, 1);
        }

        var recentOpen = tickets
            .Where(t => t.Status == "Aberto" || t.Status == "Em andamento")
            .OrderByDescending(t => t.CreatedAt)
            .Take(5)
            .Select(t => new TicketSummaryDto(t.Id, t.Title, t.Category, t.Priority, t.Status, t.CreatedAt))
            .ToList();

        return Result<SupportDashboardDto>.Success(new SupportDashboardDto(
            tickets.Count,
            open,
            inProgress,
            resolved,
            urgentOpen,
            byStatus,
            byPriority,
            byCategory,
            avgDays,
            recentOpen));
    }
}
