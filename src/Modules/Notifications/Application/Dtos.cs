namespace ERPlus.Modules.Notifications.Application;

public record NotificationDto(
    int Id,
    int UserId,
    string Type,
    string Title,
    string Message,
    string? RelatedEntityType,
    int? RelatedEntityId,
    bool IsRead,
    DateTime? ReadAt,
    DateTime CreatedAt);

public record CreateNotificationRequest(
    int UserId,
    string Type,
    string Title,
    string Message,
    string? RelatedEntityType = null,
    int? RelatedEntityId = null);

public record UnreadCountDto(int Count);
