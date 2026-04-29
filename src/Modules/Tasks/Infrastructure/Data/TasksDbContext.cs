using ERPlus.Modules.Tasks.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Tasks.Infrastructure.Data;

public class TasksDbContext : DbContext
{
    public const string Schema = "tasks";
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Planning> Plannings => Set<Planning>();

    public TasksDbContext(DbContextOptions<TasksDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.Entity<TaskItem>(e =>
        {
            e.ToTable("tasks");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(500).IsRequired();
            e.Property(x => x.Status).HasMaxLength(30);
            e.Property(x => x.Category).HasMaxLength(50);
            e.HasQueryFilter(x => !x.IsDeleted);
        });

        modelBuilder.Entity<Planning>(e =>
        {
            e.ToTable("plannings");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(500).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50);
            e.Property(x => x.Priority).HasMaxLength(20);
            e.HasQueryFilter(x => !x.IsDeleted);
        });
    }
}
