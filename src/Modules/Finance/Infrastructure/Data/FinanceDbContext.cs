using ERPlus.Modules.Finance.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Finance.Infrastructure.Data;

public class FinanceDbContext : DbContext
{
    public const string Schema = "finance";

    public DbSet<FinancialEntry> Entries => Set<FinancialEntry>();
    public DbSet<AccountPayable> AccountsPayable => Set<AccountPayable>();
    public DbSet<AccountReceivable> AccountsReceivable => Set<AccountReceivable>();
    public DbSet<CostCenter> CostCenters => Set<CostCenter>();
    public DbSet<BankAccount> BankAccounts => Set<BankAccount>();

    public FinanceDbContext(DbContextOptions<FinanceDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.Entity<FinancialEntry>(e =>
        {
            e.ToTable("entries");
            e.HasKey(x => x.Id);
            e.Property(x => x.Value).HasPrecision(18, 2);
            e.Property(x => x.Type).HasMaxLength(20);
            e.Property(x => x.Status).HasMaxLength(20);
            e.Property(x => x.Description).HasMaxLength(500);
            e.HasOne(x => x.CostCenter).WithMany().HasForeignKey(x => x.CostCenterId);
            e.HasOne(x => x.Account).WithMany().HasForeignKey(x => x.AccountId);
            e.HasQueryFilter(x => !x.IsDeleted);
        });

        modelBuilder.Entity<AccountPayable>(e =>
        {
            e.ToTable("accounts_payable");
            e.HasKey(x => x.Id);
            e.Property(x => x.Valor).HasPrecision(18, 2);
            e.Property(x => x.Status).HasMaxLength(20);
            e.HasQueryFilter(x => !x.IsDeleted);
        });

        modelBuilder.Entity<AccountReceivable>(e =>
        {
            e.ToTable("accounts_receivable");
            e.HasKey(x => x.Id);
            e.Property(x => x.Valor).HasPrecision(18, 2);
            e.Property(x => x.Status).HasMaxLength(20);
            e.HasQueryFilter(x => !x.IsDeleted);
        });

        modelBuilder.Entity<CostCenter>(e =>
        {
            e.ToTable("cost_centers");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<BankAccount>(e =>
        {
            e.ToTable("bank_accounts");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Balance).HasPrecision(18, 2);
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<BankAccount>().HasData(
            new BankAccount { Id = 1, Name = "Asaas", Balance = 10000, CreatedAt = seedDate },
            new BankAccount { Id = 2, Name = "Itaú", Balance = 100000, CreatedAt = seedDate },
            new BankAccount { Id = 3, Name = "Santander", Balance = 10000, CreatedAt = seedDate }
        );

        modelBuilder.Entity<CostCenter>().HasData(
            new CostCenter { Id = 1, Name = "Projetos de Engenharia", Type = "Receita", Category = "Operacional", Description = "Receitas de empreendimentos técnicos", CreatedAt = seedDate },
            new CostCenter { Id = 2, Name = "Consultorias", Type = "Receita", Category = "Operacional", Description = "Receitas de consultorias", CreatedAt = seedDate },
            new CostCenter { Id = 3, Name = "Aluguel Escritório", Type = "Despesa", Category = "Administrativo", Description = "Aluguel e condomínio", CreatedAt = seedDate },
            new CostCenter { Id = 4, Name = "Salários e Encargos", Type = "Despesa", Category = "Pessoal", Description = "Folha de pagamento", CreatedAt = seedDate },
            new CostCenter { Id = 5, Name = "Material de Escritório", Type = "Despesa", Category = "Administrativo", Description = "Materiais e suprimentos", CreatedAt = seedDate },
            new CostCenter { Id = 6, Name = "Software e Licenças", Type = "Despesa", Category = "Tecnologia", Description = "AutoCAD, licenças", CreatedAt = seedDate },
            new CostCenter { Id = 7, Name = "Impostos", Type = "Despesa", Category = "Tributário", Description = "ISS, IR, CSLL", CreatedAt = seedDate }
        );

        modelBuilder.Entity<FinancialEntry>().HasData(
            new FinancialEntry { Id = 1, Type = "receita", Date = new DateTime(2026, 2, 15, 0, 0, 0, DateTimeKind.Utc), Description = "Laudo Geotécnico - Engecorps", ClientId = 4, CostCenterId = 1, AccountId = 2, Value = 18000, Status = "Efetuado", CreatedAt = seedDate },
            new FinancialEntry { Id = 2, Type = "receita", Date = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc), Description = "Consultoria LOT - Horizonte", ClientId = 1, CostCenterId = 2, AccountId = 2, Value = 5000, Status = "Em aberto", CreatedAt = seedDate },
            new FinancialEntry { Id = 3, Type = "despesa", Date = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc), Description = "Aluguel Março", CostCenterId = 3, AccountId = 2, Value = 3500, Status = "Efetuado", CreatedAt = seedDate },
            new FinancialEntry { Id = 4, Type = "despesa", Date = new DateTime(2026, 3, 5, 0, 0, 0, DateTimeKind.Utc), Description = "AutoCAD - Licença anual", CostCenterId = 6, AccountId = 1, Value = 8500, Status = "Em aberto", CreatedAt = seedDate },
            new FinancialEntry { Id = 5, Type = "receita", Date = new DateTime(2026, 3, 10, 0, 0, 0, DateTimeKind.Utc), Description = "Viabilidade - Della Giustina", ClientId = 2, CostCenterId = 1, AccountId = 2, Value = 12000, Status = "Em aberto", CreatedAt = seedDate },
            new FinancialEntry { Id = 6, Type = "despesa", Date = new DateTime(2026, 2, 28, 0, 0, 0, DateTimeKind.Utc), Description = "ISS Fevereiro", CostCenterId = 7, AccountId = 2, Value = 900, Status = "Vencido", CreatedAt = seedDate }
        );

        modelBuilder.Entity<AccountReceivable>().HasData(
            new AccountReceivable { Id = 1, Descricao = "Parcela 1 — Contrato Della Giustina", ClientId = 2, Valor = 15000, Vencimento = new DateTime(2026, 4, 15, 0, 0, 0, DateTimeKind.Utc), Status = "Em aberto", CostCenterId = 1, CreatedAt = seedDate },
            new AccountReceivable { Id = 2, Descricao = "Parcela 2 — Contrato Della Giustina", ClientId = 2, Valor = 15000, Vencimento = new DateTime(2026, 5, 15, 0, 0, 0, DateTimeKind.Utc), Status = "Em aberto", CostCenterId = 1, CreatedAt = seedDate },
            new AccountReceivable { Id = 3, Descricao = "Consultoria LOT — Horizonte", ClientId = 1, Valor = 5000, Vencimento = new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc), Status = "Em aberto", CostCenterId = 2, CreatedAt = seedDate }
        );

        modelBuilder.Entity<AccountPayable>().HasData(
            new AccountPayable { Id = 1, Descricao = "Aluguel Escritório — Maio/2026", Valor = 3500, Vencimento = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc), Status = "Em aberto", CostCenterId = 3, CreatedAt = seedDate },
            new AccountPayable { Id = 2, Descricao = "Alvará de funcionamento 2026", Valor = 890, Vencimento = new DateTime(2026, 4, 30, 0, 0, 0, DateTimeKind.Utc), Status = "Em aberto", CostCenterId = 3, CreatedAt = seedDate }
        );
    }
}
