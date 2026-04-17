using ERPlus.Modules.Tasks.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Tasks.Infrastructure.Data;

public class TasksDbContext : DbContext
{
    public const string Schema = "tasks";
    public DbSet<TaskItem> Tasks => Set<TaskItem>();

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

        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        modelBuilder.Entity<TaskItem>().HasData(
            new TaskItem { Id = 1, DealId = 1, Title = "Primeiro contato", Status = "Finalizado", ResponsibleId = 1, Due = new DateTime(2026, 2, 15, 0, 0, 0, DateTimeKind.Utc), CreatedAt = seedDate },
            new TaskItem { Id = 2, DealId = 1, Title = "Elaborar proposta", Status = "Em andamento", ResponsibleId = 1, Due = new DateTime(2026, 3, 10, 0, 0, 0, DateTimeKind.Utc), CreatedAt = seedDate },
            new TaskItem { Id = 3, DealId = 3, Title = "Primeiro contato", Status = "Não iniciado", ResponsibleId = 1, Due = new DateTime(2026, 3, 6, 0, 0, 0, DateTimeKind.Utc), CreatedAt = seedDate }
        );
    }
}
