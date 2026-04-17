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
    public DbSet<DealTimelineEntry> DealTimeline => Set<DealTimelineEntry>();

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

        modelBuilder.Entity<DealTimelineEntry>(e =>
        {
            e.ToTable("deal_timeline");
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasMaxLength(30).IsRequired();
            e.Property(x => x.Text).HasMaxLength(1000).IsRequired();
            e.HasIndex(x => x.DealId);
            e.HasQueryFilter(x => !x.IsDeleted);
        });
    }
}
