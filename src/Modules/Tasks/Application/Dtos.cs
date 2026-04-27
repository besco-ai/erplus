namespace ERPlus.Modules.Tasks.Application;

public record TaskDto(
    int Id, int? DealId, int? ProjectId, string Title, string? Description,
    string Status, int ResponsibleId, DateTime? Due, string? SubtasksJson,
    string? Category, DateTime CreatedAt, bool IsOverdue,
    string? Recurrence, string? RecurrenceId);

public record CreateTaskRequest(
    string Title, string? Description, int ResponsibleId, DateTime? Due,
    int? DealId, int? ProjectId, string? Category,
    string? Recurrence, string? RecurrenceId);

public record UpdateTaskRequest(
    string? Title, string? Description, string? Status, int? ResponsibleId,
    DateTime? Due, string? SubtasksJson, string? Category);

public record TaskSummaryDto(
    int Total, int NaoIniciado, int EmAndamento, int EmRevisao,
    int Finalizado, int Atrasadas);

public record TaskSeriesDto(
    string RecurrenceId,
    string Title,
    string Recurrence,
    int Count,
    string FirstDate,
    string LastDate);
