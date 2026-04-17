using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Schedule.Domain.Entities;

public class Event : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? Time { get; set; }
    public int DurationMinutes { get; set; } = 60;
    public string Type { get; set; } = "geral"; // geral, comercial, producao
    public int? RefId { get; set; }
    public string? Color { get; set; }
    public string? Notes { get; set; }
    public int? ResponsibleId { get; set; }
}
