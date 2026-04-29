using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Tasks.Domain.Entities;

public class Planning : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "A Fazer";       // A Fazer | Em Progresso | Em Revisão | Concluído
    public string Priority { get; set; } = "Média";       // Alta | Média | Baixa
    public int ResponsibleId { get; set; }
    public DateTime? Due { get; set; }
}
