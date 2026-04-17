using ERPlus.Modules.Schedule.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Schedule.Infrastructure.Data;

public class ScheduleDbContext : DbContext
{
    public const string Schema = "schedule";
    public DbSet<Event> Events => Set<Event>();

    public ScheduleDbContext(DbContextOptions<ScheduleDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.Entity<Event>(e =>
        {
            e.ToTable("events");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(300).IsRequired();
            e.Property(x => x.Type).HasMaxLength(30);
            e.Property(x => x.Color).HasMaxLength(20);
            e.HasQueryFilter(x => !x.IsDeleted);
        });

        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        modelBuilder.Entity<Event>().HasData(
            new Event { Id = 1, Title = "Reunião Della Giustina", Date = new DateTime(2026, 3, 10, 0, 0, 0, DateTimeKind.Utc), Time = "10:00", DurationMinutes = 60, Type = "comercial", RefId = 1, Color = "#C41E2A", CreatedAt = seedDate },
            new Event { Id = 2, Title = "AJECI - Reunião mensal", Date = new DateTime(2026, 3, 12, 0, 0, 0, DateTimeKind.Utc), Time = "19:00", DurationMinutes = 90, Type = "geral", Color = "#10B981", CreatedAt = seedDate }
        );
    }
}
