using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Commercial.Domain.Entities;

/// <summary>
/// Histórico cronológico de eventos de um negócio (mudança de etapa, ganho/
/// perdido, criação de orçamento/contrato, tarefa criada, etc.). Populado
/// automaticamente pelos serviços que modificam o Deal.
/// </summary>
public class DealTimelineEntry : BaseEntity
{
    public int DealId { get; set; }
    public DateTime Date { get; set; }
    public string Type { get; set; } = string.Empty;  // stage, task, quote, contract, won, lost, briefing, diligence
    public string Text { get; set; } = string.Empty;
}

public class Deal : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public decimal Value { get; set; }
    public int PipelineId { get; set; }
    public int StageId { get; set; }
    public int ResponsibleId { get; set; }
    public DateTime Date { get; set; }
    public int Probability { get; set; }
    public string? Notes { get; set; }
    public string DealStatus { get; set; } = "Ativo"; // Ativo, Ganho, Perdido
    public int? BusinessTypeId { get; set; }
    public string? Registro { get; set; }
    public string? InscricaoImob { get; set; }
    public string? EndEmpreendimento { get; set; }

    public Pipeline Pipeline { get; set; } = null!;
    public PipelineStage Stage { get; set; } = null!;
    public ICollection<Quote> Quotes { get; set; } = new List<Quote>();
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
    public ICollection<DealAta> Atas { get; set; } = new List<DealAta>();
    public ICollection<DealDiligence> Diligences { get; set; } = new List<DealDiligence>();
}

public class Pipeline : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public ICollection<PipelineStage> Stages { get; set; } = new List<PipelineStage>();
    public ICollection<Deal> Deals { get; set; } = new List<Deal>();
}

public class PipelineStage : BaseEntity
{
    public int PipelineId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public string? AutoTasksJson { get; set; } // JSON array of auto-task titles
    public int? AutoMoveStageId { get; set; }
    public int? AutoDiligenceTemplateId { get; set; }

    public Pipeline Pipeline { get; set; } = null!;
}

public class Quote : BaseEntity
{
    public string Numero { get; set; } = string.Empty;
    public int DealId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public string? ItemsJson { get; set; } // JSON serialized items
    public decimal Valor { get; set; }
    public string Status { get; set; } = "Rascunho"; // Rascunho, Enviado, Aprovado, Recusado
    public DateTime Data { get; set; }
    public DateTime? Validade { get; set; }
    public string? Conditions { get; set; }
    public DateTime? StatusChangedAt { get; set; }

    public Deal Deal { get; set; } = null!;
}

public class Contract : BaseEntity
{
    public string Numero { get; set; } = string.Empty;
    public int? QuoteId { get; set; }
    public int DealId { get; set; }
    public int ClientId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public string Status { get; set; } = "Vigente";
    public DateTime DataInicio { get; set; }
    public DateTime? DataFim { get; set; }
    public int ResponsibleId { get; set; }
    public string? Registro { get; set; }
    public string? InscricaoImob { get; set; }
    public string? EndEmpreendimento { get; set; }
    public int? BusinessTypeId { get; set; }

    public Deal Deal { get; set; } = null!;
}

public class DealAta : BaseEntity
{
    public int DealId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? LinksJson { get; set; }

    public Deal Deal { get; set; } = null!;
}

public class DealDiligence : BaseEntity
{
    public int DealId { get; set; }
    public int TemplateId { get; set; }
    public string? ItemsJson { get; set; } // JSON serialized checklist items

    public Deal Deal { get; set; } = null!;
}

public class BusinessType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class DiligenceTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int? BusinessTypeId { get; set; }
    public string? ItemsJson { get; set; }
}

public class BriefingTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? ItemsJson { get; set; }
}

public class DealBriefing : BaseEntity
{
    public int DealId { get; set; }
    public int TemplateId { get; set; }
    public string? ItemsJson { get; set; }

    public Deal Deal { get; set; } = null!;
}
