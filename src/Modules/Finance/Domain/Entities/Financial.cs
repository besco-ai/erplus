using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Finance.Domain.Entities;

public class FinancialEntry : BaseEntity
{
    public string Type { get; set; } = "receita"; // receita, despesa
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public int? ClientId { get; set; }
    public int CostCenterId { get; set; }
    public int AccountId { get; set; }
    public decimal Value { get; set; }
    public string Status { get; set; } = "Em aberto"; // Em aberto, Efetuado, Vencido

    public CostCenter CostCenter { get; set; } = null!;
    public BankAccount Account { get; set; } = null!;
}

public class AccountPayable : BaseEntity
{
    public string Descricao { get; set; } = string.Empty;
    public int? ClientId { get; set; }
    public int? FornecedorId { get; set; }
    public decimal Valor { get; set; }
    public DateTime Vencimento { get; set; }
    public string Status { get; set; } = "Em aberto";
    public int CostCenterId { get; set; }
    public string? Observacoes { get; set; }
}

public class AccountReceivable : BaseEntity
{
    public string Descricao { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public decimal Valor { get; set; }
    public DateTime Vencimento { get; set; }
    public string Status { get; set; } = "Em aberto";
    public int CostCenterId { get; set; }
    public int? ContractId { get; set; }
    public string? Observacoes { get; set; }
}

public class CostCenter : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Receita"; // Receita, Despesa
    public string? Category { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "Ativo";
}

public class BankAccount : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public decimal Balance { get; set; }
}
