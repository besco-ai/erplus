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
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();

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

        modelBuilder.Entity<PurchaseOrder>(e =>
        {
            e.ToTable("purchase_orders");
            e.HasKey(x => x.Id);
            e.Property(x => x.Numero).HasMaxLength(20).IsRequired();
            e.HasIndex(x => x.Numero).IsUnique();
            e.Property(x => x.Titulo).HasMaxLength(300);
            e.Property(x => x.Status).HasMaxLength(20);
            e.Property(x => x.Valor).HasPrecision(18, 2);
            e.HasQueryFilter(x => !x.IsDeleted);
        });
    }
}
