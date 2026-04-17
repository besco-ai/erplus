using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Documents.Domain.Entities;

public class Ticket : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "Geral"; // Geral, Bug, Melhoria, Dúvida
    public string Priority { get; set; } = "Normal"; // Baixa, Normal, Alta, Urgente
    public string Status { get; set; } = "Aberto"; // Aberto, Em andamento, Resolvido, Fechado
    public int CreatedById { get; set; }
    public int? AssignedToId { get; set; }
    public string? Resolution { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
