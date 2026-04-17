using ERPlus.Modules.Documents.Domain.Entities;
using ERPlus.Modules.Documents.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Documents.Application;

// DTOs
public record AttachmentDto(int Id, string EntityType, int EntityId, string Label, string Url, DateTime Date);
public record CreateAttachmentRequest(string EntityType, int EntityId, string Label, string Url);
public record TemplateDto(int Id, string Name, string Tipo, string Corpo, string? Observacoes);
public record CreateTemplateRequest(string Name, string Tipo, string Corpo, string? Observacoes);
public record UpdateTemplateRequest(string? Name, string? Tipo, string? Corpo, string? Observacoes);
public record TimelineEntryDto(int Id, int? DealId, int? ProjectId, DateTime Date, string Type, string Text);
public record CreateTimelineRequest(int? DealId, int? ProjectId, string Type, string Text);

// Ticket DTOs
public record TicketDto(
    int Id, string Title, string Description, string Category, string Priority,
    string Status, int CreatedById, int? AssignedToId, string? Resolution,
    DateTime? ResolvedAt, DateTime CreatedAt);
public record CreateTicketRequest(string Title, string Description, string? Category, string? Priority);
public record UpdateTicketRequest(string? Title, string? Status, string? Priority, int? AssignedToId, string? Resolution);

// Service
public class DocumentsService
{
    private readonly DocumentsDbContext _db;
    public DocumentsService(DocumentsDbContext db) => _db = db;

    // Attachments
    public async Task<Result<List<AttachmentDto>>> GetAttachmentsAsync(string entityType, int entityId) =>
        Result<List<AttachmentDto>>.Success(await _db.Attachments
            .Where(a => a.EntityType == entityType && a.EntityId == entityId)
            .OrderByDescending(a => a.Date)
            .Select(a => new AttachmentDto(a.Id, a.EntityType, a.EntityId, a.Label, a.Url, a.Date))
            .ToListAsync());

    public async Task<Result<AttachmentDto>> AddAttachmentAsync(CreateAttachmentRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Url)) return Result<AttachmentDto>.Failure("URL é obrigatória");
        var a = new Attachment { EntityType = r.EntityType, EntityId = r.EntityId, Label = r.Label?.Trim() ?? "Arquivo", Url = r.Url.Trim(), Date = DateTime.UtcNow };
        _db.Attachments.Add(a);
        await _db.SaveChangesAsync();
        return Result<AttachmentDto>.Created(new AttachmentDto(a.Id, a.EntityType, a.EntityId, a.Label, a.Url, a.Date));
    }

    public async Task<Result<bool>> DeleteAttachmentAsync(int id)
    {
        var a = await _db.Attachments.FindAsync(id);
        if (a is null) return Result<bool>.NotFound();
        _db.Attachments.Remove(a);
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    // Templates
    public async Task<Result<List<TemplateDto>>> GetTemplatesAsync(string? tipo) =>
        Result<List<TemplateDto>>.Success(await _db.Templates
            .Where(t => tipo == null || t.Tipo == tipo).OrderBy(t => t.Name)
            .Select(t => new TemplateDto(t.Id, t.Name, t.Tipo, t.Corpo, t.Observacoes)).ToListAsync());

    public async Task<Result<TemplateDto>> CreateTemplateAsync(CreateTemplateRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Name)) return Result<TemplateDto>.Failure("Nome é obrigatório");
        var t = new DocumentTemplate { Name = r.Name.Trim(), Tipo = r.Tipo, Corpo = r.Corpo, Observacoes = r.Observacoes };
        _db.Templates.Add(t);
        await _db.SaveChangesAsync();
        return Result<TemplateDto>.Created(new TemplateDto(t.Id, t.Name, t.Tipo, t.Corpo, t.Observacoes));
    }

    public async Task<Result<TemplateDto>> UpdateTemplateAsync(int id, UpdateTemplateRequest r)
    {
        var t = await _db.Templates.FindAsync(id);
        if (t is null) return Result<TemplateDto>.NotFound();
        if (r.Name is not null) t.Name = r.Name.Trim();
        if (r.Tipo is not null) t.Tipo = r.Tipo;
        if (r.Corpo is not null) t.Corpo = r.Corpo;
        if (r.Observacoes is not null) t.Observacoes = r.Observacoes;
        t.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<TemplateDto>.Success(new TemplateDto(t.Id, t.Name, t.Tipo, t.Corpo, t.Observacoes));
    }

    public async Task<Result<bool>> DeleteTemplateAsync(int id)
    {
        var t = await _db.Templates.FindAsync(id);
        if (t is null) return Result<bool>.NotFound();
        _db.Templates.Remove(t);
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    // Timeline
    public async Task<Result<List<TimelineEntryDto>>> GetTimelineAsync(int? dealId, int? projectId)
    {
        var query = _db.Timeline.AsQueryable();
        if (dealId.HasValue) query = query.Where(t => t.DealId == dealId.Value);
        if (projectId.HasValue) query = query.Where(t => t.ProjectId == projectId.Value);
        return Result<List<TimelineEntryDto>>.Success(await query.OrderByDescending(t => t.Date)
            .Select(t => new TimelineEntryDto(t.Id, t.DealId, t.ProjectId, t.Date, t.Type, t.Text)).ToListAsync());
    }

    public async Task<Result<TimelineEntryDto>> AddTimelineAsync(CreateTimelineRequest r)
    {
        var entry = new TimelineEntry { DealId = r.DealId, ProjectId = r.ProjectId, Date = DateTime.UtcNow, Type = r.Type, Text = r.Text };
        _db.Timeline.Add(entry);
        await _db.SaveChangesAsync();
        return Result<TimelineEntryDto>.Created(new TimelineEntryDto(entry.Id, entry.DealId, entry.ProjectId, entry.Date, entry.Type, entry.Text));
    }

    // Tickets
    public async Task<Result<List<TicketDto>>> GetTicketsAsync(string? status, int? createdById)
    {
        var query = _db.Tickets.AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(t => t.Status == status);
        if (createdById.HasValue) query = query.Where(t => t.CreatedById == createdById.Value);

        return Result<List<TicketDto>>.Success(await query.OrderByDescending(t => t.CreatedAt)
            .Select(t => new TicketDto(t.Id, t.Title, t.Description, t.Category, t.Priority,
                t.Status, t.CreatedById, t.AssignedToId, t.Resolution, t.ResolvedAt, t.CreatedAt))
            .ToListAsync());
    }

    public async Task<Result<TicketDto>> CreateTicketAsync(CreateTicketRequest r, int createdById)
    {
        if (string.IsNullOrWhiteSpace(r.Title)) return Result<TicketDto>.Failure("Título é obrigatório");
        var ticket = new Ticket
        {
            Title = r.Title.Trim(), Description = r.Description?.Trim() ?? "",
            Category = r.Category ?? "Geral", Priority = r.Priority ?? "Normal",
            Status = "Aberto", CreatedById = createdById
        };
        _db.Tickets.Add(ticket);
        await _db.SaveChangesAsync();
        return Result<TicketDto>.Created(new TicketDto(ticket.Id, ticket.Title, ticket.Description,
            ticket.Category, ticket.Priority, ticket.Status, ticket.CreatedById,
            null, null, null, ticket.CreatedAt));
    }

    public async Task<Result<TicketDto>> UpdateTicketAsync(int id, UpdateTicketRequest r)
    {
        var ticket = await _db.Tickets.FindAsync(id);
        if (ticket is null) return Result<TicketDto>.NotFound();
        if (r.Title is not null) ticket.Title = r.Title.Trim();
        if (r.Status is not null)
        {
            ticket.Status = r.Status;
            if (r.Status == "Resolvido" && ticket.ResolvedAt is null) ticket.ResolvedAt = DateTime.UtcNow;
        }
        if (r.Priority is not null) ticket.Priority = r.Priority;
        if (r.AssignedToId.HasValue) ticket.AssignedToId = r.AssignedToId.Value;
        if (r.Resolution is not null) ticket.Resolution = r.Resolution;
        ticket.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<TicketDto>.Success(new TicketDto(ticket.Id, ticket.Title, ticket.Description,
            ticket.Category, ticket.Priority, ticket.Status, ticket.CreatedById,
            ticket.AssignedToId, ticket.Resolution, ticket.ResolvedAt, ticket.CreatedAt));
    }

    public async Task<Result<bool>> DeleteTicketAsync(int id)
    {
        var ticket = await _db.Tickets.FindAsync(id);
        if (ticket is null) return Result<bool>.NotFound();
        ticket.IsDeleted = true; ticket.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}
