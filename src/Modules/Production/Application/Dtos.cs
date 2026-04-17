namespace ERPlus.Modules.Production.Application;

public record ProductionItemDto(
    int Id, string Title, string? Description, string Category, string Status,
    int? DealId, int? ProjectId, int? ClientId, int ResponsibleId,
    DateTime? Due, int? ProdItemTypeId, string? ProdItemTypeName,
    DateTime CreatedAt, bool IsOverdue);

public record CreateProductionItemRequest(
    string Title, string? Description, string Category, int ResponsibleId,
    DateTime? Due, int? DealId, int? ProjectId, int? ClientId, int? ProdItemTypeId);

public record UpdateProductionItemRequest(
    string? Title, string? Description, string? Status, int? ResponsibleId,
    DateTime? Due, string? Category);

public record ProductionItemTypeDto(
    int Id, string Name, string Categoria, string? Descricao, string? AutoTasksJson, string Status);

public record CreateItemTypeRequest(string Name, string Categoria, string? Descricao, string? AutoTasksJson);

public record ProductionSummaryDto(string Category, string CategoryLabel, int Total, int NaoIniciado, int EmAndamento, int Finalizado);
