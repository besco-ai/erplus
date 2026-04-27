using ERPlus.Modules.Schedule.Domain.Entities;
using ERPlus.Modules.Schedule.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Schedule.Application.Services;

public class EventService
{
    private readonly ScheduleDbContext _db;

    public EventService(ScheduleDbContext db) => _db = db;

    private static DateTime AsUtc(DateTime d) =>
        d.Kind == DateTimeKind.Utc ? d : DateTime.SpecifyKind(d.ToUniversalTime(), DateTimeKind.Utc);

    private static EventDto ToDto(Event e) => new(
        e.Id, e.Title, e.Date, e.Time, e.DurationMinutes,
        e.Type, e.RefId, e.RefType, e.Color, e.Notes, e.ResponsibleId,
        e.Visibility, e.Recurrence, e.RecurrenceId, e.CreatedAt);

    public async Task<Result<List<EventDto>>> GetAllAsync(DateTime? from, DateTime? to, string? type, int? responsibleId)
    {
        var query = _db.Events.AsQueryable();
        if (from.HasValue) { var f = AsUtc(from.Value); query = query.Where(e => e.Date >= f); }
        if (to.HasValue)   { var t = AsUtc(to.Value);   query = query.Where(e => e.Date <= t); }
        if (!string.IsNullOrEmpty(type)) query = query.Where(e => e.Type == type);
        if (responsibleId.HasValue) query = query.Where(e => e.ResponsibleId == responsibleId.Value);

        var items = await query.OrderBy(e => e.Date).ThenBy(e => e.Time).ToListAsync();
        return Result<List<EventDto>>.Success(items.Select(ToDto).ToList());
    }

    public async Task<Result<EventDto>> CreateAsync(CreateEventRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Title)) return Result<EventDto>.Failure("Título é obrigatório");

        var recurrence = r.Recurrence ?? "Sem recorrência";
        var visibility = r.Visibility ?? "compartilhada";
        var color = r.Color ?? TypeColor(r.Type);

        // Série recorrente — cria múltiplos eventos
        if (recurrence != "Sem recorrência")
        {
            var recurrenceId = Guid.NewGuid().ToString();
            var dates = GenerateDates(AsUtc(r.Date), recurrence);
            Event? first = null;

            foreach (var date in dates)
            {
                var ev = new Event
                {
                    Title = r.Title.Trim(), Date = date, Time = r.Time,
                    DurationMinutes = r.DurationMinutes > 0 ? r.DurationMinutes : 60,
                    Type = r.Type ?? "geral", RefId = r.RefId, RefType = r.RefType,
                    Color = color, Notes = r.Notes, ResponsibleId = r.ResponsibleId,
                    Visibility = visibility, Recurrence = recurrence, RecurrenceId = recurrenceId,
                };
                _db.Events.Add(ev);
                first ??= ev;
            }

            await _db.SaveChangesAsync();
            return Result<EventDto>.Created(ToDto(first!));
        }

        // Evento único
        var single = new Event
        {
            Title = r.Title.Trim(), Date = AsUtc(r.Date), Time = r.Time,
            DurationMinutes = r.DurationMinutes > 0 ? r.DurationMinutes : 60,
            Type = r.Type ?? "geral", RefId = r.RefId, RefType = r.RefType,
            Color = color, Notes = r.Notes, ResponsibleId = r.ResponsibleId,
            Visibility = visibility, Recurrence = recurrence, RecurrenceId = null,
        };
        _db.Events.Add(single);
        await _db.SaveChangesAsync();
        return Result<EventDto>.Created(ToDto(single));
    }

    private static string TypeColor(string? type) => type switch
    {
        "reuniao"   => "#8B5CF6",
        "comercial" => "#C41E2A",
        "producao"  => "#3B82F6",
        "pessoal"   => "#F59E0B",
        _           => "#10B981",
    };

    private static List<DateTime> GenerateDates(DateTime start, string recurrence) => recurrence switch
    {
        "Diariamente"  => Enumerable.Range(0, 30).Select(i => start.AddDays(i)).ToList(),
        "Semanalmente" => Enumerable.Range(0, 12).Select(i => start.AddDays(i * 7)).ToList(),
        "Mensalmente"  => Enumerable.Range(0, 12).Select(i => start.AddMonths(i)).ToList(),
        _              => [start],
    };

    public async Task<Result<EventDto>> UpdateAsync(int id, UpdateEventRequest r)
    {
        var ev = await _db.Events.FindAsync(id);
        if (ev is null) return Result<EventDto>.NotFound();

        if (r.Title is not null) ev.Title = r.Title.Trim();
        if (r.Date.HasValue) ev.Date = AsUtc(r.Date.Value);
        if (r.Time is not null) ev.Time = r.Time;
        if (r.DurationMinutes.HasValue) ev.DurationMinutes = r.DurationMinutes.Value;
        if (r.Type is not null) { ev.Type = r.Type; ev.Color = TypeColor(r.Type); }
        if (r.RefId.HasValue) ev.RefId = r.RefId;
        if (r.RefType is not null) ev.RefType = r.RefType;
        if (r.Color is not null) ev.Color = r.Color;
        if (r.Notes is not null) ev.Notes = r.Notes;
        if (r.ResponsibleId.HasValue) ev.ResponsibleId = r.ResponsibleId.Value;
        if (r.Visibility is not null) ev.Visibility = r.Visibility;
        if (r.Recurrence is not null) ev.Recurrence = r.Recurrence;
        ev.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<EventDto>.Success(ToDto(ev));
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var ev = await _db.Events.FindAsync(id);
        if (ev is null) return Result<bool>.NotFound();
        ev.IsDeleted = true; ev.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    /// <summary>Lista todas as séries recorrentes ativas (agrupadas por RecurrenceId).</summary>
    public async Task<Result<List<RecurrenceSeriesDto>>> GetSeriesAsync()
    {
        var groups = await _db.Events
            .Where(e => e.RecurrenceId != null)
            .GroupBy(e => e.RecurrenceId!)
            .Select(g => new
            {
                RecurrenceId = g.Key,
                Title      = g.First().Title,
                Type       = g.First().Type,
                Color      = g.First().Color,
                Recurrence = g.First().Recurrence,
                Count      = g.Count(),
                FirstDate  = g.Min(e => e.Date),
                LastDate   = g.Max(e => e.Date),
            })
            .OrderBy(g => g.FirstDate)
            .ToListAsync();

        var result = groups.Select(g => new RecurrenceSeriesDto(
            g.RecurrenceId, g.Title, g.Type, g.Color, g.Recurrence,
            g.Count,
            g.FirstDate.ToString("yyyy-MM-dd"),
            g.LastDate.ToString("yyyy-MM-dd"))).ToList();

        return Result<List<RecurrenceSeriesDto>>.Success(result);
    }

    /// <summary>Exclui todos os eventos de uma série recorrente.</summary>
    public async Task<Result<bool>> DeleteSeriesAsync(string recurrenceId)
    {
        var events = await _db.Events.Where(e => e.RecurrenceId == recurrenceId).ToListAsync();
        foreach (var ev in events) { ev.IsDeleted = true; ev.UpdatedAt = DateTime.UtcNow; }
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}
