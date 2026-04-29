using ERPlus.Modules.Tasks.Domain.Entities;
using ERPlus.Modules.Tasks.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Tasks.Application.Services;

public class PlanningService(TasksDbContext db)
{
    private static PlanningDto Map(Planning p) => new(
        p.Id, p.Title, p.Description, p.Status, p.Priority,
        p.ResponsibleId, p.Due, p.CreatedAt);

    public async Task<Result<List<PlanningDto>>> GetAllAsync(
        int? responsibleId = null,
        string? status = null,
        string? priority = null)
    {
        var q = db.Plannings.AsNoTracking().AsQueryable();

        if (responsibleId.HasValue) q = q.Where(x => x.ResponsibleId == responsibleId.Value);
        if (!string.IsNullOrEmpty(status))   q = q.Where(x => x.Status == status);
        if (!string.IsNullOrEmpty(priority)) q = q.Where(x => x.Priority == priority);

        var items = await q.OrderByDescending(x => x.CreatedAt).ToListAsync();
        return Result<List<PlanningDto>>.Success(items.Select(Map).ToList());
    }

    public async Task<Result<PlanningDto>> CreateAsync(CreatePlanningRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Title))
            return Result<PlanningDto>.Failure("Título obrigatório.");

        var p = new Planning
        {
            Title         = r.Title.Trim(),
            Description   = r.Description,
            Status        = r.Status ?? "A Fazer",
            Priority      = r.Priority ?? "Média",
            ResponsibleId = r.ResponsibleId,
            Due           = r.Due.HasValue
                              ? DateTime.SpecifyKind(r.Due.Value, DateTimeKind.Utc)
                              : null,
            CreatedAt     = DateTime.UtcNow,
        };

        db.Plannings.Add(p);
        await db.SaveChangesAsync();
        return Result<PlanningDto>.Created(Map(p));
    }

    public async Task<Result<PlanningDto>> UpdateAsync(int id, UpdatePlanningRequest r)
    {
        var p = await db.Plannings.FindAsync(id);
        if (p is null) return Result<PlanningDto>.NotFound();

        if (r.Title is not null)         p.Title         = r.Title.Trim();
        if (r.Description is not null)   p.Description   = r.Description;
        if (r.Status is not null)        p.Status        = r.Status;
        if (r.Priority is not null)      p.Priority      = r.Priority;
        if (r.ResponsibleId.HasValue)    p.ResponsibleId = r.ResponsibleId.Value;
        if (r.Due.HasValue)              p.Due           = DateTime.SpecifyKind(r.Due.Value, DateTimeKind.Utc);

        p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Result<PlanningDto>.Success(Map(p));
    }

    public async Task<Result<PlanningDto>> MoveAsync(int id, string newStatus)
    {
        var p = await db.Plannings.FindAsync(id);
        if (p is null) return Result<PlanningDto>.NotFound();

        p.Status    = newStatus;
        p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Result<PlanningDto>.Success(Map(p));
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var p = await db.Plannings.FindAsync(id);
        if (p is null) return Result<bool>.NotFound();

        p.IsDeleted = true;
        p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}
