using ERPlus.Modules.Config.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Config.Infrastructure.Data;

public class ConfigDbContext : DbContext
{
    public const string Schema = "config";
    public DbSet<ServiceItem> Services => Set<ServiceItem>();
    public DbSet<CompanySettings> Settings => Set<CompanySettings>();

    public ConfigDbContext(DbContextOptions<ConfigDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.Entity<ServiceItem>(e =>
        {
            e.ToTable("services");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Category).HasMaxLength(100);
            e.Property(x => x.Unit).HasMaxLength(30);
            e.Property(x => x.Price).HasPrecision(18, 2);
            e.Property(x => x.Status).HasMaxLength(20);
        });
        modelBuilder.Entity<CompanySettings>(e =>
        {
            e.ToTable("settings");
            e.HasKey(x => x.Id);
            e.Property(x => x.Key).HasMaxLength(200).IsRequired();
            e.HasIndex(x => x.Key).IsUnique();
        });
    }
}
