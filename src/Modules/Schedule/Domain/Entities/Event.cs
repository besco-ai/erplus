using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Schedule.Domain.Entities;

public class Event : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? Time { get; set; }
    public int DurationMinutes { get; set; } = 60;

    /// <summary>Categoria do evento: geral, reuniao, comercial, producao, pessoal</summary>
    public string Type { get; set; } = "geral";

    /// <summary>ID do registro vinculado (negócio, empreendimento, etc.)</summary>
    public int? RefId { get; set; }

    /// <summary>Tipo do vínculo: deal | project | null</summary>
    public string? RefType { get; set; }

    public string? Color { get; set; }
    public string? Notes { get; set; }
    public int? ResponsibleId { get; set; }

    /// <summary>Visibilidade: compartilhada | privada</summary>
    public string Visibility { get; set; } = "compartilhada";

    /// <summary>Recorrência: Sem recorrência | Diariamente | Semanalmente | Mensalmente</summary>
    public string Recurrence { get; set; } = "Sem recorrência";

    /// <summary>GUID compartilhado por todos os eventos de uma série recorrente</summary>
    public string? RecurrenceId { get; set; }
}
