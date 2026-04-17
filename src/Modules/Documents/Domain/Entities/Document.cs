using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Documents.Domain.Entities;

public class Attachment : BaseEntity
{
    public string EntityType { get; set; } = string.Empty; // deal, project, task, contact
    public int EntityId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}

public class DocumentTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Tipo { get; set; } = "orcamento"; // orcamento, contrato
    public string Corpo { get; set; } = string.Empty;
    public string? Observacoes { get; set; }
}

public class TimelineEntry : BaseEntity
{
    public int? DealId { get; set; }
    public int? ProjectId { get; set; }
    public DateTime Date { get; set; }
    public string Type { get; set; } = string.Empty; // stage, task, quote, won, event, pipeline
    public string Text { get; set; } = string.Empty;
}
