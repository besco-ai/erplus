namespace ERPlus.Modules.Schedule.Application;

public record EventDto(
    int Id,
    string Title,
    DateTime Date,
    string? Time,
    int DurationMinutes,
    string Type,
    int? RefId,
    string? RefType,
    string? Color,
    string? Notes,
    int? ResponsibleId,
    string Visibility,
    string Recurrence,
    string? RecurrenceId,
    DateTime CreatedAt);

public record CreateEventRequest(
    string Title,
    DateTime Date,
    string? Time,
    int DurationMinutes,
    string Type,
    int? RefId,
    string? RefType,
    string? Color,
    string? Notes,
    int? ResponsibleId,
    string? Visibility,
    string? Recurrence);

public record UpdateEventRequest(
    string? Title,
    DateTime? Date,
    string? Time,
    int? DurationMinutes,
    string? Type,
    int? RefId,
    string? RefType,
    string? Color,
    string? Notes,
    int? ResponsibleId,
    string? Visibility,
    string? Recurrence);
