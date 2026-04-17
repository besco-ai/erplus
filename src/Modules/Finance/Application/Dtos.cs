namespace ERPlus.Modules.Finance.Application;

// ── Financial Entry (Lançamentos) ──
public record FinancialEntryDto(
    int Id, string Type, DateTime Date, string Description, int? ClientId,
    int CostCenterId, string? CostCenterName, int AccountId, string? AccountName,
    decimal Value, string Status, DateTime CreatedAt);

public record CreateEntryRequest(
    string Type, DateTime Date, string Description, int? ClientId,
    int CostCenterId, int AccountId, decimal Value, string? Status);

public record UpdateEntryRequest(
    string? Type, DateTime? Date, string? Description, int? ClientId,
    int? CostCenterId, int? AccountId, decimal? Value, string? Status);

// ── Contas a Receber ──
public record AccountReceivableDto(
    int Id, string Descricao, int ClientId, decimal Valor, DateTime Vencimento,
    string Status, int CostCenterId, string? CostCenterName, int? ContractId,
    string? Observacoes, DateTime CreatedAt);

public record CreateReceivableRequest(
    string Descricao, int ClientId, decimal Valor, DateTime Vencimento,
    int CostCenterId, int? ContractId, string? Observacoes);

public record UpdateReceivableRequest(
    string? Descricao, decimal? Valor, DateTime? Vencimento, string? Status, string? Observacoes);

// ── Contas a Pagar ──
public record AccountPayableDto(
    int Id, string Descricao, int? ClientId, int? FornecedorId, decimal Valor,
    DateTime Vencimento, string Status, int CostCenterId, string? CostCenterName,
    string? Observacoes, DateTime CreatedAt);

public record CreatePayableRequest(
    string Descricao, int? FornecedorId, decimal Valor, DateTime Vencimento,
    int CostCenterId, string? Observacoes);

public record UpdatePayableRequest(
    string? Descricao, decimal? Valor, DateTime? Vencimento, string? Status, string? Observacoes);

// ── Centros de Custo ──
public record CostCenterDto(int Id, string Name, string Type, string? Category, string? Description, string Status);
public record CreateCostCenterRequest(string Name, string Type, string? Category, string? Description);

// ── Contas Bancárias ──
public record BankAccountDto(int Id, string Name, decimal Balance);
public record CreateBankAccountRequest(string Name, decimal Balance);

// ── Dashboard financeiro ──
public record FinanceSummaryDto(
    decimal TotalReceitas, decimal TotalDespesas, decimal Saldo,
    decimal AReceber, decimal APagar, int VencidasCount);
