using ERPlus.Modules.Tasks.Domain.Entities;
using ERPlus.Modules.Tasks.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Tasks.Application.Services;

public class TaskService
{
    private readonly TasksDbContext _db;
    private static readonly HashSet<string> ValidStatuses = new()
        { "Não iniciado", "Em andamento", "Em revisão", "Finalizado" };

    public TaskService(TasksDbContext db) => _db = db;

    public async Task<Result<TaskSummaryDto>> GetSummaryAsync(int? responsibleId)
    {
        var query = _db.Tasks.AsQueryable();
        if (responsibleId.HasValue) query = query.Where(t => t.ResponsibleId == responsibleId.Value);

        var tasks = await query.ToListAsync();
        var today = DateTime.UtcNow.Date;

        return Result<TaskSummaryDto>.Success(new TaskSummaryDto(
            tasks.Count,
            tasks.Count(t => t.Status == "Não iniciado"),
            tasks.Count(t => t.Status == "Em andamento"),
            tasks.Count(t => t.Status == "Em revisão"),
            tasks.Count(t => t.Status == "Finalizado"),
            tasks.Count(t => t.Status != "Finalizado" && t.Due.HasValue && t.Due.Value.Date < today)));
    }

    public async Task<Result<List<TaskDto>>> GetAllAsync(
        string? status, int? responsibleId, int? dealId, int? projectId, string? category, bool? overdue)
    {
        var query = _db.Tasks.AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(t => t.Status == status);
        if (responsibleId.HasValue) query = query.Where(t => t.ResponsibleId == responsibleId.Value);
        if (dealId.HasValue) query = query.Where(t => t.DealId == dealId.Value);
        if (projectId.HasValue) query = query.Where(t => t.ProjectId == projectId.Value);
        if (!string.IsNullOrEmpty(category)) query = query.Where(t => t.Category == category);

        var today = DateTime.UtcNow.Date;
        if (overdue == true)
            query = query.Where(t => t.Status != "Finalizado" && t.Due.HasValue && t.Due.Value.Date < today);

        var items = await query.OrderBy(t => t.Due ?? DateTime.MaxValue).ThenBy(t => t.Title)
            .Select(t => new TaskDto(
                t.Id, t.DealId, t.ProjectId, t.Title, t.Description,
                t.Status, t.ResponsibleId, t.Due, t.SubtasksJson,
                t.Category, t.CreatedAt,
                t.Status != "Finalizado" && t.Due.HasValue && t.Due.Value.Date < today))
            .ToListAsync();

        return Result<List<TaskDto>>.Success(items);
    }

    public async Task<Result<TaskDto>> GetByIdAsync(int id)
    {
        var t = await _db.Tasks.FindAsync(id);
        if (t is null) return Result<TaskDto>.NotFound();
        var today = DateTime.UtcNow.Date;

        return Result<TaskDto>.Success(new TaskDto(
            t.Id, t.DealId, t.ProjectId, t.Title, t.Description,
            t.Status, t.ResponsibleId, t.Due, t.SubtasksJson,
            t.Category, t.CreatedAt,
            t.Status != "Finalizado" && t.Due.HasValue && t.Due.Value.Date < today));
    }

    public async Task<Result<TaskDto>> CreateAsync(CreateTaskRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Title))
            return Result<TaskDto>.Failure("Título é obrigatório");

        var task = new TaskItem
        {
            Title = r.Title.Trim(),
            Description = r.Description?.Trim(),
            Status = "Não iniciado",
            ResponsibleId = r.ResponsibleId > 0 ? r.ResponsibleId : 1,
            Due = r.Due,
            DealId = r.DealId,
            ProjectId = r.ProjectId,
            Category = r.Category
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();

        return Result<TaskDto>.Created(new TaskDto(
            task.Id, task.DealId, task.ProjectId, task.Title, task.Description,
            task.Status, task.ResponsibleId, task.Due, null, task.Category,
            task.CreatedAt, false));
    }

    public async Task<Result<TaskDto>> UpdateAsync(int id, UpdateTaskRequest r)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task is null) return Result<TaskDto>.NotFound();

        if (r.Title is not null) task.Title = r.Title.Trim();
        if (r.Description is not null) task.Description = r.Description.Trim();
        if (r.Status is not null)
        {
            if (!ValidStatuses.Contains(r.Status))
                return Result<TaskDto>.Failure($"Status inválido. Use: {string.Join(", ", ValidStatuses)}");
            task.Status = r.Status;
        }
        if (r.ResponsibleId.HasValue) task.ResponsibleId = r.ResponsibleId.Value;
        if (r.Due.HasValue) task.Due = r.Due.Value;
        if (r.SubtasksJson is not null) task.SubtasksJson = r.SubtasksJson;
        if (r.Category is not null) task.Category = r.Category;

        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var today = DateTime.UtcNow.Date;
        return Result<TaskDto>.Success(new TaskDto(
            task.Id, task.DealId, task.ProjectId, task.Title, task.Description,
            task.Status, task.ResponsibleId, task.Due, task.SubtasksJson,
            task.Category, task.CreatedAt,
            task.Status != "Finalizado" && task.Due.HasValue && task.Due.Value.Date < today));
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task is null) return Result<bool>.NotFound();
        task.IsDeleted = true;
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}
