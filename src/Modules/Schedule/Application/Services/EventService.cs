using ERPlus.Modules.Schedule.Domain.Entities;
using ERPlus.Modules.Schedule.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Schedule.Application.Services;

public class EventService
{
    private readonly ScheduleDbContext _db;

    public EventService(ScheduleDbContext db) => _db = db;

    // Npgsql rejects DateTime with Kind=Unspecified when the column is
    // timestamp with time zone. Query-string dates come in as Unspecified
    // (no offset), so normalize here.
    private static DateTime AsUtc(DateTime d) =>
        d.Kind == DateTimeKind.Utc ? d : DateTime.SpecifyKind(d.ToUniversalTime(), DateTimeKind.Utc);

    public async Task<Result<List<EventDto>>> GetAllAsync(DateTime? from, DateTime? to, string? type, int? responsibleId)
    {
        var query = _db.Events.AsQueryable();
        if (from.HasValue) { var f = AsUtc(from.Value); query = query.Where(e => e.Date >= f); }
        if (to.HasValue)   { var t = AsUtc(to.Value);   query = query.Where(e => e.Date <= t); }
        if (!string.IsNullOrEmpty(type)) query = query.Where(e => e.Type == type);
        if (responsibleId.HasValue) query = query.Where(e => e.ResponsibleId == responsibleId.Value);

        var items = await query.OrderBy(e => e.Date).ThenBy(e => e.Time)
            .Select(e => new EventDto(e.Id, e.Title, e.Date, e.Time, e.DurationMinutes,
                e.Type, e.RefId, e.Color, e.Notes, e.ResponsibleId, e.CreatedAt))
            .ToListAsync();

        return Result<List<EventDto>>.Success(items);
    }

    public async Task<Result<EventDto>> CreateAsync(CreateEventRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Title)) return Result<EventDto>.Failure("Título é obrigatório");

        var ev = new Event
        {
            Title = r.Title.Trim(), Date = AsUtc(r.Date), Time = r.Time,
            DurationMinutes = r.DurationMinutes > 0 ? r.DurationMinutes : 60,
            Type = r.Type ?? "geral", RefId = r.RefId,
            Color = r.Color, Notes = r.Notes, ResponsibleId = r.ResponsibleId
        };
        _db.Events.Add(ev);
        await _db.SaveChangesAsync();

        return Result<EventDto>.Created(new EventDto(
            ev.Id, ev.Title, ev.Date, ev.Time, ev.DurationMinutes,
            ev.Type, ev.RefId, ev.Color, ev.Notes, ev.ResponsibleId, ev.CreatedAt));
    }

    public async Task<Result<EventDto>> UpdateAsync(int id, UpdateEventRequest r)
    {
        var ev = await _db.Events.FindAsync(id);
        if (ev is null) return Result<EventDto>.NotFound();

        if (r.Title is not null) ev.Title = r.Title.Trim();
        if (r.Date.HasValue) ev.Date = AsUtc(r.Date.Value);
        if (r.Time is not null) ev.Time = r.Time;
        if (r.DurationMinutes.HasValue) ev.DurationMinutes = r.DurationMinutes.Value;
        if (r.Type is not null) ev.Type = r.Type;
        if (r.Color is not null) ev.Color = r.Color;
        if (r.Notes is not null) ev.Notes = r.Notes;
        if (r.ResponsibleId.HasValue) ev.ResponsibleId = r.ResponsibleId.Value;
        ev.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<EventDto>.Success(new EventDto(
            ev.Id, ev.Title, ev.Date, ev.Time, ev.DurationMinutes,
            ev.Type, ev.RefId, ev.Color, ev.Notes, ev.ResponsibleId, ev.CreatedAt));
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var ev = await _db.Events.FindAsync(id);
        if (ev is null) return Result<bool>.NotFound();
        ev.IsDeleted = true; ev.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}
