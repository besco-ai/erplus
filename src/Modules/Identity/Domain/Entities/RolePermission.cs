using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Identity.Domain.Entities;

public class RolePermission : BaseEntity
{
    public string RoleName { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty; // ex: "dashboard", "comercial", "financeiro"
    public bool CanView { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}
