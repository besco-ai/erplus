using ERPlus.Modules.Notifications.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Notifications.Infrastructure.Data;

public class NotificationsDbContext : DbContext
{
    public const string Schema = "notifications";
    public DbSet<Notification> Notifications => Set<Notification>();

    public NotificationsDbContext(DbContextOptions<NotificationsDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.Entity<Notification>(e =>
        {
            e.ToTable("notifications");
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasMaxLength(50).IsRequired();
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Message).HasMaxLength(1000).IsRequired();
            e.Property(x => x.RelatedEntityType).HasMaxLength(50);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => new { x.UserId, x.IsRead });
            e.HasQueryFilter(x => !x.IsDeleted);
        });
    }
}
