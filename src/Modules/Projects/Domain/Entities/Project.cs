using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Projects.Domain.Entities;

public class Project : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public int? DealId { get; set; }
    public int PipelineId { get; set; }
    public int StageId { get; set; }
    public decimal Value { get; set; }
    public int ResponsibleId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Notes { get; set; }
    public string? Registro { get; set; }
    public string? InscricaoImob { get; set; }
    public string? EndEmpreendimento { get; set; }
    public string? TipologiaTerreno { get; set; }
    public string? MorfologiaTerreno { get; set; }
    public string? Testada { get; set; }
    public string? AreaTerreno { get; set; }
    public int? BusinessTypeId { get; set; }

    public ProjectPipeline Pipeline { get; set; } = null!;
    public ProjectStage Stage { get; set; } = null!;
}

public class ProjectPipeline : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public ICollection<ProjectStage> Stages { get; set; } = new List<ProjectStage>();
}

public class ProjectStage : BaseEntity
{
    public int PipelineId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public string? AutoTasksJson { get; set; }

    public ProjectPipeline Pipeline { get; set; } = null!;
}
