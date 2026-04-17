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

public class PurchaseOrder : BaseEntity
{
    public string Numero { get; set; } = string.Empty;  // OC-001
    public string Titulo { get; set; } = string.Empty;
    public int? FornecedorId { get; set; }               // FK Contact (contato do tipo fornecedor)
    public DateTime Data { get; set; }
    public DateTime? PrazoEntrega { get; set; }
    public decimal Valor { get; set; }
    public string Status { get; set; } = "Rascunho";     // Rascunho, Enviada, Aprovada, Recebida, Cancelada
    public int? CostCenterId { get; set; }
    public int? ResponsibleId { get; set; }
    public string? ItemsJson { get; set; }               // [{ descricao, qty, unitPrice }]
    public string? Observacoes { get; set; }
    public int? AccountPayableId { get; set; }           // Criado quando a OC vira AP (Sprint 4 cascata)
}
