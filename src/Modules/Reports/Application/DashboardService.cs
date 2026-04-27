using ERPlus.Modules.Commercial.Infrastructure.Data;
using ERPlus.Modules.Finance.Infrastructure.Data;
using ERPlus.Modules.Projects.Infrastructure.Data;
using ERPlus.Modules.Tasks.Infrastructure.Data;
using ERPlus.Modules.Schedule.Infrastructure.Data;
using ERPlus.Modules.Identity.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Reports.Application;

public record DashboardDto(
    // KPIs
    int DealsCount, decimal DealsValue,
    int ProjectsCount, string ProjectsByStage,
    int WonQuotes, int TotalQuotes, int ConversionRate,
    int PendingTasks, int OverdueTasks,
    int TodayEvents,
    // Finance
    decimal TotalReceitas, decimal TotalDespesas, decimal Saldo,
    // Funnel
    List<FunnelItemDto> Funnel,
    // Today
    List<TodayEventDto> TodayEventsList,
    // Overdue tasks
    List<OverdueTaskDto> OverdueTasksList,
    // Recent timeline
    List<TimelineItemDto> RecentActivity,
    // Team performance
    List<TeamPerfDto> TeamPerformance,
    // Projects by stage
    List<StageCountDto> ProjectStages);

public record FunnelItemDto(string Pipeline, string Stage, int Count, decimal Value);
public record TodayEventDto(int Id, string Title, string? Time, int Duration, string Type, string? Color);
public record OverdueTaskDto(int Id, string Title, string Due, int ResponsibleId);
public record TimelineItemDto(string Text, string Date, string Type);
public record TeamPerfDto(string Name, string Initials, int Deals, decimal Value, int Done, int Pending);
public record StageCountDto(string Name, int Count);

public class DashboardService
{
    private readonly CommercialDbContext _commercial;
    private readonly FinanceDbContext _finance;
    private readonly ProjectsDbContext _projects;
    private readonly TasksDbContext _tasks;
    private readonly ScheduleDbContext _schedule;
    private readonly IdentityDbContext _identity;

    public DashboardService(
        CommercialDbContext commercial, FinanceDbContext finance,
        ProjectsDbContext projects, TasksDbContext tasks,
        ScheduleDbContext schedule, IdentityDbContext identity)
    {
        _commercial = commercial;
        _finance = finance;
        _projects = projects;
        _tasks = tasks;
        _schedule = schedule;
        _identity = identity;
    }

    public async Task<Result<DashboardDto>> GetDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        // Deals
        var deals = await _commercial.Deals.Include(d => d.Pipeline).Include(d => d.Stage).ToListAsync();
        var activeDeals = deals.Where(d => d.DealStatus == "Ativo").ToList();

        // Quotes
        var quotes = await _commercial.Quotes.ToListAsync();
        var wonQuotes = quotes.Count(q => q.Status == "Aprovado");

        // Funnel
        var pipelines = await _commercial.Pipelines.Include(p => p.Stages.OrderBy(s => s.Order)).ToListAsync();
        var funnel = pipelines.SelectMany(pl =>
            pl.Stages.Select(st =>
            {
                var stDeals = activeDeals.Where(d => d.PipelineId == pl.Id && d.StageId == st.Id).ToList();
                return new FunnelItemDto(pl.Name, st.Name, stDeals.Count, stDeals.Sum(d => d.Value));
            })).Where(f => f.Count > 0).ToList();

        // Projects
        var projects = await _projects.Projects.ToListAsync();
        var projStages = await _projects.Stages.Where(s => s.PipelineId == 100).OrderBy(s => s.Order).ToListAsync();
        var projByStage = projStages.Select(s => new StageCountDto(s.Name, projects.Count(p => p.StageId == s.Id))).ToList();
        var projByStageStr = string.Join(" · ", projByStage.Select(s => s.Count));

        // Tasks
        var allTasks = await _tasks.Tasks.ToListAsync();
        var pending = allTasks.Where(t => t.Status != "Finalizado").ToList();
        var overdue = pending.Where(t => t.Due.HasValue && t.Due.Value.Date < today).ToList();

        // Events today
        var todayEvents = await _schedule.Events
            .Where(e => e.Date >= today && e.Date < tomorrow)
            .OrderBy(e => e.Time)
            .Select(e => new TodayEventDto(e.Id, e.Title, e.Time, e.DurationMinutes, e.Type, e.Color))
            .ToListAsync();

        // Finance
        var entries = await _finance.Entries.ToListAsync();
        var totalReceitas = entries.Where(e => e.Type == "receita" && e.Status == "Efetuado").Sum(e => e.Value);
        var totalDespesas = entries.Where(e => e.Type == "despesa" && e.Status == "Efetuado").Sum(e => e.Value);

        // Users + team perf
        var users = await _identity.Users.ToListAsync();
        var teamPerf = users.Select(u =>
        {
            var uDeals = activeDeals.Where(d => d.ResponsibleId == u.Id).ToList();
            var uTasks = allTasks.Where(t => t.ResponsibleId == u.Id).ToList();
            return new TeamPerfDto(u.Name, u.Initials,
                uDeals.Count, uDeals.Sum(d => d.Value),
                uTasks.Count(t => t.Status == "Finalizado"),
                uTasks.Count(t => t.Status != "Finalizado"));
        }).ToList();

        // Overdue tasks list
        var overdueList = overdue.OrderBy(t => t.Due).Take(10)
            .Select(t => new OverdueTaskDto(t.Id, t.Title,
                t.Due?.ToString("yyyy-MM-dd") ?? "", t.ResponsibleId))
            .ToList();

        // Recent activity — last 60 days, up to 15 items across deals, quotes, tasks
        var since = today.AddDays(-60);
        var activityRaw = new List<(DateTime Date, string Text, string Type)>();

        var recentDeals = await _commercial.Deals
            .Where(d => !d.IsDeleted && d.CreatedAt >= since)
            .OrderByDescending(d => d.CreatedAt)
            .Take(6).ToListAsync();
        activityRaw.AddRange(recentDeals.Select(d =>
            (d.CreatedAt, $"Criado: {d.Title}", "create")));

        var movedDeals = await _commercial.Deals
            .Where(d => !d.IsDeleted && d.UpdatedAt != null && d.UpdatedAt >= since)
            .OrderByDescending(d => d.UpdatedAt)
            .Take(6).ToListAsync();
        activityRaw.AddRange(movedDeals.Select(d =>
            (d.UpdatedAt!.Value, $"Movido: {d.Title}", "move")));

        var recentQuotes = await _commercial.Quotes
            .Where(q => !q.IsDeleted && q.CreatedAt >= since)
            .OrderByDescending(q => q.CreatedAt)
            .Take(6).ToListAsync();
        activityRaw.AddRange(recentQuotes.Select(q =>
            (q.CreatedAt, $"Orçamento: {q.Numero}", "quote")));

        var doneTasks = await _tasks.Tasks
            .Where(t => !t.IsDeleted && t.Status == "Finalizado"
                     && t.UpdatedAt != null && t.UpdatedAt >= since)
            .OrderByDescending(t => t.UpdatedAt)
            .Take(6).ToListAsync();
        activityRaw.AddRange(doneTasks.Select(t =>
            (t.UpdatedAt!.Value, $"Tarefa concluída: {t.Title}", "task")));

        var recentEvents = await _schedule.Events
            .Where(e => e.CreatedAt >= since)
            .OrderByDescending(e => e.CreatedAt)
            .Take(4).ToListAsync();
        activityRaw.AddRange(recentEvents.Select(e =>
            (e.CreatedAt, $"Evento: {e.Title}", "event")));

        var timelineItems = activityRaw
            .OrderByDescending(a => a.Date)
            .Take(15)
            .Select(a => new TimelineItemDto(a.Text, a.Date.ToString("yyyy-MM-dd"), a.Type))
            .ToList();

        return Result<DashboardDto>.Success(new DashboardDto(
            activeDeals.Count, activeDeals.Sum(d => d.Value),
            projects.Count, projByStageStr,
            wonQuotes, quotes.Count,
            quotes.Count > 0 ? (int)Math.Round(wonQuotes * 100.0 / quotes.Count) : 0,
            pending.Count, overdue.Count,
            todayEvents.Count,
            totalReceitas, totalDespesas, totalReceitas - totalDespesas,
            funnel, todayEvents, overdueList,
            timelineItems,
            teamPerf, projByStage));
    }
}
