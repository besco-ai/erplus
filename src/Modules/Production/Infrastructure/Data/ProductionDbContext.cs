using ERPlus.Modules.Production.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Production.Infrastructure.Data;

public class ProductionDbContext : DbContext
{
    public const string Schema = "production";
    public DbSet<ProductionItem> Items => Set<ProductionItem>();
    public DbSet<ProductionItemType> ItemTypes => Set<ProductionItemType>();

    public ProductionDbContext(DbContextOptions<ProductionDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.Entity<ProductionItem>(e =>
        {
            e.ToTable("items");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(500).IsRequired();
            e.Property(x => x.Category).HasMaxLength(50);
            e.Property(x => x.Status).HasMaxLength(30);
            e.HasOne(x => x.ProdItemType).WithMany().HasForeignKey(x => x.ProdItemTypeId);
            e.HasQueryFilter(x => !x.IsDeleted);
        });
        modelBuilder.Entity<ProductionItemType>(e =>
        {
            e.ToTable("item_types");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Categoria).HasMaxLength(50);
        });
    }
}
