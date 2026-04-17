using ERPlus.Modules.Projects.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Projects.Infrastructure.Data;

public class ProjectsDbContext : DbContext
{
    public const string Schema = "projects";

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectPipeline> Pipelines => Set<ProjectPipeline>();
    public DbSet<ProjectStage> Stages => Set<ProjectStage>();

    public ProjectsDbContext(DbContextOptions<ProjectsDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.Entity<Project>(e =>
        {
            e.ToTable("projects");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(500);
            e.Property(x => x.Value).HasPrecision(18, 2);
            e.HasOne(x => x.Pipeline).WithMany().HasForeignKey(x => x.PipelineId);
            e.HasOne(x => x.Stage).WithMany().HasForeignKey(x => x.StageId);
            e.HasQueryFilter(x => !x.IsDeleted);
        });

        modelBuilder.Entity<ProjectPipeline>(e =>
        {
            e.ToTable("pipelines");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<ProjectStage>(e =>
        {
            e.ToTable("stages");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.Pipeline).WithMany(p => p.Stages).HasForeignKey(x => x.PipelineId);
        });
    }
}
