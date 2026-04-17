using ERPlus.Modules.Automation.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Automation.Infrastructure.Data;

public class AutomationDbContext : DbContext
{
    public const string Schema = "automation";
    public DbSet<AutomationRule> Rules => Set<AutomationRule>();

    public AutomationDbContext(DbContextOptions<AutomationDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.Entity<AutomationRule>(e =>
        {
            e.ToTable("rules");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(300).IsRequired();
            e.Property(x => x.Trigger).HasMaxLength(50);
            e.Property(x => x.Action).HasMaxLength(50);
            e.Property(x => x.TaskTitle).HasMaxLength(300);
        });
    }
}
