namespace ERPlus.Modules.Schedule.Application;

public record EventDto(
    int Id, string Title, DateTime Date, string? Time, int DurationMinutes,
    string Type, int? RefId, string? Color, string? Notes, int? ResponsibleId,
    DateTime CreatedAt);

public record CreateEventRequest(
    string Title, DateTime Date, string? Time, int DurationMinutes,
    string Type, int? RefId, string? Color, string? Notes, int? ResponsibleId);

public record UpdateEventRequest(
    string? Title, DateTime? Date, string? Time, int? DurationMinutes,
    string? Type, string? Color, string? Notes, int? ResponsibleId);
