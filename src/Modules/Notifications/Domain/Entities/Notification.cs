using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Notifications.Domain.Entities;

public class Notification : BaseEntity
{
    public int UserId { get; set; }
    public string Type { get; set; } = string.Empty;       // task_assigned, deal_updated, etc.
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? RelatedEntityType { get; set; }         // "Task", "Deal", "Project"
    public int? RelatedEntityId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}
