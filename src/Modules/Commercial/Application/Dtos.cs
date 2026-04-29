namespace ERPlus.Modules.Commercial.Application;

// ── Deal ──
public record DealDto(
    int Id, string Title, int ClientId, string? ClientName, decimal Value,
    int PipelineId, string? PipelineName, int StageId, string? StageName,
    int ResponsibleId, string? ResponsibleName, DateTime Date,
    int Probability, string DealStatus, int? BusinessTypeId, string? BusinessTypeName,
    string? Registro, string? InscricaoImob, string? EndEmpreendimento,
    int QuotesCount, int ContractsCount, int AtasCount);

public record DealDetailDto(
    int Id, string Title, int ClientId, string? ClientName, decimal Value,
    int PipelineId, int StageId, string? StageName,
    int ResponsibleId, DateTime Date, int Probability, string? Notes,
    string DealStatus, int? BusinessTypeId, string? Registro,
    string? InscricaoImob, string? EndEmpreendimento,
    List<QuoteDto> Quotes, List<ContractDto> Contracts,
    List<DealAtaDto> Atas, List<DealDiligenceDto> Diligences,
    List<DealBriefingDto> Briefings);

public record CreateDealRequest(
    string? Title, int ClientId, decimal Value, int PipelineId, int StageId,
    int ResponsibleId, int Probability, string? Notes, int? BusinessTypeId,
    string? Registro, string? InscricaoImob, string? EndEmpreendimento);

public record UpdateDealRequest(
    string? Title, int? ClientId, decimal? Value, int? StageId,
    int? ResponsibleId, int? Probability, string? Notes, string? DealStatus,
    int? BusinessTypeId, string? Registro, string? InscricaoImob, string? EndEmpreendimento);

public record MoveDealRequest(int StageId, int? PipelineId);

// ── Pipeline ──
public record PipelineDto(int Id, string Name, int Order, List<PipelineStageDto> Stages);
public record PipelineStageDto(int Id, string Name, int Order, string? AutoTasksJson, int DealCount, decimal TotalValue);
public record CreatePipelineRequest(string Name, List<CreateStageRequest>? Stages);
public record UpdatePipelineRequest(string? Name, int? Order);
public record CreateStageRequest(string Name, int Order, string? AutoTasksJson);
public record UpdateStageRequest(string? Name, int? Order, string? AutoTasksJson);

// ── Quote ──
public record QuoteDto(
    int Id, string Numero, int? DealId, string Titulo, int ClientId,
    string? ItemsJson, decimal Valor, string Status, DateTime Data,
    DateTime? Validade, string? Conditions, DateTime? StatusChangedAt,
    string? FormaPagamento, int NumeroParcelas, DateTime? DataPrimeiroPagamento,
    string? Observacoes);

public record CreateQuoteRequest(
    int? DealId, string Titulo, int ClientId, string? ItemsJson,
    decimal Valor, DateTime? Validade, string? Conditions,
    string? FormaPagamento, int NumeroParcelas, DateTime? DataPrimeiroPagamento,
    string? Observacoes);

public record UpdateQuoteStatusRequest(string Status);

// ── Contract ──
public record ContractDto(
    int Id, string Numero, int? QuoteId, int? DealId, int ClientId,
    string Titulo, decimal Valor, string Status, DateTime DataInicio,
    DateTime? DataFim, int ResponsibleId, string? Registro,
    string? InscricaoImob, string? EndEmpreendimento, int? BusinessTypeId,
    string? FormaPagamento, int NumeroParcelas, DateTime? DataPrimeiroPagamento);

public record CreateContractRequest(
    int? DealId, int ClientId, string Titulo, decimal Valor,
    int ResponsibleId, DateTime? DataInicio, DateTime? DataFim, int? QuoteId,
    string? FormaPagamento, int NumeroParcelas, DateTime? DataPrimeiroPagamento);

// ── Ata ──
public record DealAtaDto(int Id, int DealId, string Title, DateTime Date, string Content, string? LinksJson);
public record CreateAtaRequest(string Title, string Content, string? LinksJson);

// ── Diligence ──
public record DealDiligenceDto(int Id, int DealId, int TemplateId, string? TemplateName, string? ItemsJson);
public record LoadDiligenceRequest(int TemplateId);
public record UpdateDiligenceItemsRequest(string ItemsJson);

// ── Briefing ──
public record DealBriefingDto(int Id, int DealId, int TemplateId, string? TemplateName, string? ItemsJson);
public record LoadBriefingRequest(int TemplateId);

// ── BusinessType ──
public record BusinessTypeDto(int Id, string Name, string? Description);
public record CreateBusinessTypeRequest(string Name, string? Description);

// ── Templates ──
public record DiligenceTemplateDto(int Id, string Name, int? BusinessTypeId, string? ItemsJson);
public record CreateDiligenceTemplateRequest(string Name, int? BusinessTypeId, string? ItemsJson);
public record UpdateDiligenceTemplateRequest(string? Name, int? BusinessTypeId, string? ItemsJson);

public record BriefingTemplateDto(int Id, string Name, string? ItemsJson);
public record CreateBriefingTemplateRequest(string Name, string? ItemsJson);
public record UpdateBriefingTemplateRequest(string? Name, string? ItemsJson);

public record UpdateBriefingItemsRequest(string? ItemsJson);

// ── Timeline (histórico de eventos do deal) ──
public record DealTimelineEntryDto(int Id, int DealId, DateTime Date, string Type, string Text);
