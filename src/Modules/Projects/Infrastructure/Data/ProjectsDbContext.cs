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

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<ProjectPipeline>().HasData(
            new ProjectPipeline { Id = 100, Name = "Empreendimentos", Order = 0, CreatedAt = seedDate }
        );

        modelBuilder.Entity<ProjectStage>().HasData(
            new ProjectStage { Id = 101, PipelineId = 100, Name = "Aprovação", Order = 0, AutoTasksJson = "[\"Análise documental\"]", CreatedAt = seedDate },
            new ProjectStage { Id = 102, PipelineId = 100, Name = "Em projeto", Order = 1, AutoTasksJson = "[\"Iniciar projeto executivo\"]", CreatedAt = seedDate },
            new ProjectStage { Id = 103, PipelineId = 100, Name = "Em obra", Order = 2, CreatedAt = seedDate },
            new ProjectStage { Id = 104, PipelineId = 100, Name = "Entregue", Order = 3, CreatedAt = seedDate }
        );

        modelBuilder.Entity<Project>().HasData(
            new Project
            {
                Id = 1,
                Title = "Incorporadora Della Giustina - 01-15-02-50-01",
                ClientId = 2,
                DealId = 1,
                PipelineId = 100,
                StageId = 102,
                Value = 45000,
                ResponsibleId = 1,
                StartDate = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                EndDate = new DateTime(2026, 6, 30, 0, 0, 0, DateTimeKind.Utc),
                Registro = "R-45.231",
                InscricaoImob = "0115025001",
                EndEmpreendimento = "Rua das Palmeiras, 450 - Glória, Joinville/SC",
                TipologiaTerreno = "Retangular",
                MorfologiaTerreno = "Plano",
                Testada = "15",
                AreaTerreno = "450",
                BusinessTypeId = 1,
                CreatedAt = seedDate
            }
        );
    }
}
