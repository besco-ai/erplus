using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Config.Domain.Entities;

public class ServiceItem : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Unit { get; set; }
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "Ativo";
}

public class CompanySettings : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}
