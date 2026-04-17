namespace ERPlus.Modules.Projects.Application;

// ── Project ──
public record ProjectDto(
    int Id, string Title, int ClientId, int? DealId, decimal Value,
    int PipelineId, string? PipelineName, int StageId, string? StageName,
    int ResponsibleId, DateTime? StartDate, DateTime? EndDate,
    string? Registro, string? InscricaoImob, string? EndEmpreendimento,
    string? TipologiaTerreno, string? MorfologiaTerreno,
    string? Testada, string? AreaTerreno, int? BusinessTypeId,
    DateTime CreatedAt);

public record ProjectDetailDto(
    int Id, string Title, int ClientId, int? DealId, decimal Value,
    int PipelineId, int StageId, string? StageName,
    int ResponsibleId, DateTime? StartDate, DateTime? EndDate, string? Notes,
    string? Registro, string? InscricaoImob, string? EndEmpreendimento,
    string? TipologiaTerreno, string? MorfologiaTerreno,
    string? Testada, string? AreaTerreno, int? BusinessTypeId,
    DateTime CreatedAt, DateTime? UpdatedAt);

public record CreateProjectRequest(
    string Title, int ClientId, int? DealId, decimal Value,
    int PipelineId, int StageId, int ResponsibleId,
    DateTime? StartDate, DateTime? EndDate, string? Notes,
    string? Registro, string? InscricaoImob, string? EndEmpreendimento,
    string? TipologiaTerreno, string? MorfologiaTerreno,
    string? Testada, string? AreaTerreno, int? BusinessTypeId);

public record UpdateProjectRequest(
    string? Title, int? ClientId, decimal? Value, int? StageId,
    int? ResponsibleId, DateTime? StartDate, DateTime? EndDate, string? Notes,
    string? Registro, string? InscricaoImob, string? EndEmpreendimento,
    string? TipologiaTerreno, string? MorfologiaTerreno,
    string? Testada, string? AreaTerreno);

public record MoveProjectRequest(int StageId);

// ── Pipeline ──
public record ProjectPipelineDto(int Id, string Name, int Order, List<ProjectStageDto> Stages);
public record ProjectStageDto(int Id, string Name, int Order, int ProjectCount, decimal TotalValue);
public record CreateProjectPipelineRequest(string Name);
public record CreateProjectStageRequest(string Name, int Order);
