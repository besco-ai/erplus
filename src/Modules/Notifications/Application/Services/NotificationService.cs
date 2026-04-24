using ERPlus.Modules.Notifications.Domain.Entities;
using ERPlus.Modules.Notifications.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Notifications.Application.Services;

public class NotificationService
{
    private readonly NotificationsDbContext _db;

    public NotificationService(NotificationsDbContext db)
    {
        _db = db;
    }

    public async Task<Result<List<NotificationDto>>> GetByUserAsync(int userId, bool? onlyUnread = null)
    {
        var query = _db.Notifications.Where(n => n.UserId == userId);

        if (onlyUnread == true)
            query = query.Where(n => !n.IsRead);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => ToDto(n))
            .ToListAsync();

        return Result<List<NotificationDto>>.Success(items);
    }

    public async Task<Result<UnreadCountDto>> GetUnreadCountAsync(int userId)
    {
        var count = await _db.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        return Result<UnreadCountDto>.Success(new UnreadCountDto(count));
    }

    public async Task<Result<NotificationDto>> CreateAsync(CreateNotificationRequest r)
    {
        if (r.UserId <= 0)
            return Result<NotificationDto>.Failure("UserId inválido");
        if (string.IsNullOrWhiteSpace(r.Title))
            return Result<NotificationDto>.Failure("Título é obrigatório");

        var notification = new Notification
        {
            UserId = r.UserId,
            Type = r.Type.Trim(),
            Title = r.Title.Trim(),
            Message = r.Message.Trim(),
            RelatedEntityType = r.RelatedEntityType,
            RelatedEntityId = r.RelatedEntityId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        return Result<NotificationDto>.Created(ToDto(notification));
    }

    public async Task<Result<NotificationDto>> MarkAsReadAsync(int id, int userId)
    {
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        if (n is null) return Result<NotificationDto>.NotFound();

        n.IsRead = true;
        n.ReadAt = DateTime.UtcNow;
        n.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<NotificationDto>.Success(ToDto(n));
    }

    public async Task<Result<bool>> MarkAllAsReadAsync(int userId)
    {
        var unread = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = now;
            n.UpdatedAt = now;
        }

        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> DeleteAsync(int id, int userId)
    {
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        if (n is null) return Result<bool>.NotFound();

        n.IsDeleted = true;
        n.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<bool>.Success(true);
    }

    private static NotificationDto ToDto(Notification n) => new(
        n.Id, n.UserId, n.Type, n.Title, n.Message,
        n.RelatedEntityType, n.RelatedEntityId,
        n.IsRead, n.ReadAt, n.CreatedAt);
}
