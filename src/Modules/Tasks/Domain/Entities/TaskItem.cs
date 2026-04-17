using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Tasks.Domain.Entities;

public class TaskItem : BaseEntity
{
    public int? DealId { get; set; }
    public int? ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "Não iniciado";
    public int ResponsibleId { get; set; }
    public DateTime? Due { get; set; }
    public string? SubtasksJson { get; set; }
    public string? Category { get; set; } // licenciamentos, projetos, design, etc.
}
