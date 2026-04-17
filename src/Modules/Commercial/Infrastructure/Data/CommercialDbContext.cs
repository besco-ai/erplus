using ERPlus.Modules.Commercial.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Commercial.Infrastructure.Data;

public class CommercialDbContext : DbContext
{
    public const string Schema = "commercial";

    public DbSet<Deal> Deals => Set<Deal>();
    public DbSet<Pipeline> Pipelines => Set<Pipeline>();
    public DbSet<PipelineStage> PipelineStages => Set<PipelineStage>();
    public DbSet<Quote> Quotes => Set<Quote>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<DealAta> DealAtas => Set<DealAta>();
    public DbSet<DealDiligence> DealDiligences => Set<DealDiligence>();
    public DbSet<DealBriefing> DealBriefings => Set<DealBriefing>();
    public DbSet<BusinessType> BusinessTypes => Set<BusinessType>();
    public DbSet<DiligenceTemplate> DiligenceTemplates => Set<DiligenceTemplate>();
    public DbSet<BriefingTemplate> BriefingTemplates => Set<BriefingTemplate>();

    public CommercialDbContext(DbContextOptions<CommercialDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.Entity<Deal>(e =>
        {
            e.ToTable("deals");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(500);
            e.Property(x => x.Value).HasPrecision(18, 2);
            e.Property(x => x.DealStatus).HasMaxLength(20);
            e.Property(x => x.Registro).HasMaxLength(50);
            e.Property(x => x.InscricaoImob).HasMaxLength(20);
            e.Property(x => x.EndEmpreendimento).HasMaxLength(500);
            e.HasQueryFilter(x => !x.IsDeleted);
            e.HasOne(x => x.Pipeline).WithMany(p => p.Deals).HasForeignKey(x => x.PipelineId);
            e.HasOne(x => x.Stage).WithMany().HasForeignKey(x => x.StageId);
        });

        modelBuilder.Entity<Pipeline>(e =>
        {
            e.ToTable("pipelines");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<PipelineStage>(e =>
        {
            e.ToTable("pipeline_stages");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.Pipeline).WithMany(p => p.Stages).HasForeignKey(x => x.PipelineId);
        });

        modelBuilder.Entity<Quote>(e =>
        {
            e.ToTable("quotes");
            e.HasKey(x => x.Id);
            e.Property(x => x.Numero).HasMaxLength(20);
            e.Property(x => x.Valor).HasPrecision(18, 2);
            e.Property(x => x.Status).HasMaxLength(20);
            e.HasOne(x => x.Deal).WithMany(d => d.Quotes).HasForeignKey(x => x.DealId);
        });

        modelBuilder.Entity<Contract>(e =>
        {
            e.ToTable("contracts");
            e.HasKey(x => x.Id);
            e.Property(x => x.Numero).HasMaxLength(20);
            e.Property(x => x.Valor).HasPrecision(18, 2);
            e.Property(x => x.Status).HasMaxLength(20);
            e.HasOne(x => x.Deal).WithMany(d => d.Contracts).HasForeignKey(x => x.DealId);
        });

        modelBuilder.Entity<DealAta>(e =>
        {
            e.ToTable("deal_atas");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(300);
            e.HasOne(x => x.Deal).WithMany(d => d.Atas).HasForeignKey(x => x.DealId);
        });

        modelBuilder.Entity<DealDiligence>(e =>
        {
            e.ToTable("deal_diligences");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Deal).WithMany(d => d.Diligences).HasForeignKey(x => x.DealId);
        });

        modelBuilder.Entity<DealBriefing>(e =>
        {
            e.ToTable("deal_briefings");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Deal).WithMany().HasForeignKey(x => x.DealId);
        });

        modelBuilder.Entity<BusinessType>(e =>
        {
            e.ToTable("business_types");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<DiligenceTemplate>(e =>
        {
            e.ToTable("diligence_templates");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<BriefingTemplate>(e =>
        {
            e.ToTable("briefing_templates");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        // Business Types
        modelBuilder.Entity<BusinessType>().HasData(
            new BusinessType { Id = 1, Name = "Viabilidade Técnica", Description = "Estudo de viabilidade para empreendimentos", CreatedAt = seedDate },
            new BusinessType { Id = 2, Name = "Laudo Geotécnico", Description = "Laudos de sondagem e fundações", CreatedAt = seedDate },
            new BusinessType { Id = 3, Name = "Projeto Executivo", Description = "Projetos executivos completos", CreatedAt = seedDate },
            new BusinessType { Id = 4, Name = "Avaliação Imobiliária", Description = "Avaliações NBR 14.653", CreatedAt = seedDate },
            new BusinessType { Id = 5, Name = "Consultoria Urbanística", Description = "LOT, parâmetros, código de obras", CreatedAt = seedDate }
        );

        // Pipeline: Atendimento Inicial
        modelBuilder.Entity<Pipeline>().HasData(
            new Pipeline { Id = 1, Name = "Atendimento Inicial", Order = 0, CreatedAt = seedDate },
            new Pipeline { Id = 2, Name = "Consultoria & Captação", Order = 1, CreatedAt = seedDate }
        );

        modelBuilder.Entity<PipelineStage>().HasData(
            new PipelineStage { Id = 1, PipelineId = 1, Name = "Contato inicial", Order = 0, CreatedAt = seedDate },
            new PipelineStage { Id = 2, PipelineId = 1, Name = "Envio de proposta", Order = 1, CreatedAt = seedDate },
            new PipelineStage { Id = 3, PipelineId = 1, Name = "Follow-up", Order = 2, CreatedAt = seedDate },
            new PipelineStage { Id = 4, PipelineId = 1, Name = "Negociação", Order = 3, CreatedAt = seedDate },
            new PipelineStage { Id = 5, PipelineId = 1, Name = "Fechamento", Order = 4, CreatedAt = seedDate },
            new PipelineStage { Id = 6, PipelineId = 2, Name = "Consulta inicial", Order = 0, CreatedAt = seedDate },
            new PipelineStage { Id = 7, PipelineId = 2, Name = "Análise técnica", Order = 1, CreatedAt = seedDate },
            new PipelineStage { Id = 8, PipelineId = 2, Name = "Entrega", Order = 2, CreatedAt = seedDate }
        );

        // Deals
        modelBuilder.Entity<Deal>().HasData(
            new Deal { Id = 1, Title = "Incorporadora Della Giustina", ClientId = 2, Value = 45000, PipelineId = 1, StageId = 2, ResponsibleId = 1, Date = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc), Probability = 70, DealStatus = "Ativo", BusinessTypeId = 1, Registro = "R-45.231", InscricaoImob = "0115025001", EndEmpreendimento = "Rua das Palmeiras, 450 - Glória, Joinville/SC", CreatedAt = seedDate },
            new Deal { Id = 2, Title = "Engecorps Construções", ClientId = 4, Value = 18000, PipelineId = 1, StageId = 4, ResponsibleId = 1, Date = new DateTime(2026, 2, 28, 0, 0, 0, DateTimeKind.Utc), Probability = 85, DealStatus = "Ativo", BusinessTypeId = 2, EndEmpreendimento = "Rod. SC-301, Km 12 - Distrito Industrial, Joinville/SC", CreatedAt = seedDate },
            new Deal { Id = 3, Title = "Construtora Horizonte", ClientId = 1, Value = 32000, PipelineId = 1, StageId = 1, ResponsibleId = 1, Date = new DateTime(2026, 3, 5, 0, 0, 0, DateTimeKind.Utc), Probability = 40, DealStatus = "Ativo", BusinessTypeId = 5, CreatedAt = seedDate }
        );

        // Quote
        modelBuilder.Entity<Quote>().HasData(
            new Quote { Id = 1, Numero = "ORC-001", DealId = 1, Titulo = "Viabilidade - Veneto", ClientId = 2, ItemsJson = "[{\"serviceId\":1,\"qty\":1,\"unitPrice\":12000,\"discount\":0}]", Valor = 12000, Status = "Enviado", Data = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc), Validade = new DateTime(2026, 3, 31, 0, 0, 0, DateTimeKind.Utc), Conditions = "3x", CreatedAt = seedDate }
        );
    }
}
