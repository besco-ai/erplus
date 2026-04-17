using ERPlus.Modules.Production.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Production.Infrastructure.Data;

public class ProductionDbContext : DbContext
{
    public const string Schema = "production";
    public DbSet<ProductionItem> Items => Set<ProductionItem>();
    public DbSet<ProductionItemType> ItemTypes => Set<ProductionItemType>();

    public ProductionDbContext(DbContextOptions<ProductionDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.Entity<ProductionItem>(e =>
        {
            e.ToTable("items");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(500).IsRequired();
            e.Property(x => x.Category).HasMaxLength(50);
            e.Property(x => x.Status).HasMaxLength(30);
            e.HasOne(x => x.ProdItemType).WithMany().HasForeignKey(x => x.ProdItemTypeId);
            e.HasQueryFilter(x => !x.IsDeleted);
        });
        modelBuilder.Entity<ProductionItemType>(e =>
        {
            e.ToTable("item_types");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Categoria).HasMaxLength(50);
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<ProductionItemType>().HasData(
            new ProductionItemType { Id = 1, Name = "Projeto Executivo", Categoria = "projetos", Descricao = "Projeto executivo completo", AutoTasksJson = "[\"Emitir ART\",\"Enviar ao cliente\"]", Status = "Ativo", CreatedAt = seedDate },
            new ProductionItemType { Id = 2, Name = "Projeto Estrutural", Categoria = "projetos", Descricao = "Estrutura em concreto armado", Status = "Ativo", CreatedAt = seedDate },
            new ProductionItemType { Id = 3, Name = "Projeto Elétrico", Categoria = "projetos", Descricao = "Instalações elétricas", Status = "Ativo", CreatedAt = seedDate },
            new ProductionItemType { Id = 4, Name = "Licença de Construção", Categoria = "licenciamentos", Descricao = "Aprovação prefeitura", AutoTasksJson = "[\"Protocolar processo\",\"Acompanhar aprovação\"]", Status = "Ativo", CreatedAt = seedDate },
            new ProductionItemType { Id = 5, Name = "Alvará de Funcionamento", Categoria = "licenciamentos", Descricao = "Alvará municipal", Status = "Ativo", CreatedAt = seedDate },
            new ProductionItemType { Id = 6, Name = "Identidade Visual", Categoria = "design", Descricao = "Marca e papelaria", Status = "Ativo", CreatedAt = seedDate },
            new ProductionItemType { Id = 7, Name = "Material de Marketing", Categoria = "design", Descricao = "Folders, banners e peças digitais", Status = "Ativo", CreatedAt = seedDate },
            new ProductionItemType { Id = 8, Name = "Revisão de Projeto", Categoria = "revisao_tecnica", Descricao = "Revisão técnica completa", Status = "Ativo", CreatedAt = seedDate },
            new ProductionItemType { Id = 9, Name = "Registro de Incorporação", Categoria = "incorporacoes", Descricao = "Registro no cartório", AutoTasksJson = "[\"Preparar documentação\",\"Protocolar no cartório\"]", Status = "Ativo", CreatedAt = seedDate },
            new ProductionItemType { Id = 10, Name = "Supervisão de Obras", Categoria = "supervisao", Descricao = "Acompanhamento técnico de obra", Status = "Ativo", CreatedAt = seedDate },
            new ProductionItemType { Id = 11, Name = "Vistoria Técnica", Categoria = "vistorias", Descricao = "Vistoria de conformidade", Status = "Ativo", CreatedAt = seedDate },
            new ProductionItemType { Id = 12, Name = "Averbação de Construção", Categoria = "averbacoes", Descricao = "Averbação no registro de imóveis", Status = "Ativo", CreatedAt = seedDate }
        );
    }
}
