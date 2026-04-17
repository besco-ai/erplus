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
    }
}
