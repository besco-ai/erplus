using ERPlus.Modules.Documents.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Documents.Infrastructure.Data;

public class DocumentsDbContext : DbContext
{
    public const string Schema = "documents";
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<DocumentTemplate> Templates => Set<DocumentTemplate>();
    public DbSet<TimelineEntry> Timeline => Set<TimelineEntry>();
    public DbSet<Ticket> Tickets => Set<Ticket>();

    public DocumentsDbContext(DbContextOptions<DocumentsDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.Entity<Attachment>(e =>
        {
            e.ToTable("attachments");
            e.HasKey(x => x.Id);
            e.Property(x => x.EntityType).HasMaxLength(50);
            e.Property(x => x.Label).HasMaxLength(300);
            e.Property(x => x.Url).HasMaxLength(2000);
            e.HasIndex(x => new { x.EntityType, x.EntityId });
        });
        modelBuilder.Entity<DocumentTemplate>(e =>
        {
            e.ToTable("templates");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Tipo).HasMaxLength(30);
        });
        modelBuilder.Entity<TimelineEntry>(e =>
        {
            e.ToTable("timeline");
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasMaxLength(30);
            e.Property(x => x.Text).HasMaxLength(1000);
            e.HasIndex(x => x.DealId);
            e.HasIndex(x => x.ProjectId);
        });
        modelBuilder.Entity<Ticket>(e =>
        {
            e.ToTable("tickets");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(300).IsRequired();
            e.Property(x => x.Category).HasMaxLength(30);
            e.Property(x => x.Priority).HasMaxLength(20);
            e.Property(x => x.Status).HasMaxLength(20);
            e.HasQueryFilter(x => !x.IsDeleted);
        });
    }
}
