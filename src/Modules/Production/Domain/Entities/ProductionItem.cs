using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Production.Domain.Entities;

public class ProductionItem : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "projetos"; // licenciamentos, design, projetos, revisao_tecnica, incorporacoes, supervisao, vistorias, averbacoes
    public string Status { get; set; } = "Não iniciado";
    public int? DealId { get; set; }
    public int? ProjectId { get; set; }
    public int? ClientId { get; set; }
    public int ResponsibleId { get; set; }
    public DateTime? Due { get; set; }
    public int? ProdItemTypeId { get; set; }
    public string? SubtasksJson { get; set; }  // JSON array of subtask strings

    public ProductionItemType? ProdItemType { get; set; }
}

public class ProductionItemType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Categoria { get; set; } = "projetos";
    public string? Descricao { get; set; }
    public string? AutoTasksJson { get; set; }
    public string Status { get; set; } = "Ativo";
}
