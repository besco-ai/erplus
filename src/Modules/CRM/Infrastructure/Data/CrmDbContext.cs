using ERPlus.Modules.CRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.CRM.Infrastructure.Data;

public class CrmDbContext : DbContext
{
    public const string Schema = "crm";

    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<ContactObservation> ContactObservations => Set<ContactObservation>();
    public DbSet<ContactType> ContactTypes => Set<ContactType>();

    public CrmDbContext(DbContextOptions<CrmDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.Entity<Contact>(e =>
        {
            e.ToTable("contacts");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(300).IsRequired();
            e.Property(x => x.Type).HasMaxLength(50);
            e.Property(x => x.PersonType).HasMaxLength(5);
            e.Property(x => x.Cnpj).HasMaxLength(20);
            e.Property(x => x.Cpf).HasMaxLength(15);
            e.Property(x => x.Phone).HasMaxLength(20);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.City).HasMaxLength(100);
            e.Property(x => x.State).HasMaxLength(2);
            e.Property(x => x.Status).HasMaxLength(20);
            e.Property(x => x.Position).HasMaxLength(100);
            e.HasQueryFilter(x => !x.IsDeleted);

            e.HasOne(x => x.LinkedTo)
                .WithMany(x => x.LinkedContacts)
                .HasForeignKey(x => x.LinkedToId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ContactObservation>(e =>
        {
            e.ToTable("contact_observations");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.Contact)
                .WithMany(x => x.Observations)
                .HasForeignKey(x => x.ContactId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ContactType>(e =>
        {
            e.ToTable("contact_types");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        // Contact Types
        modelBuilder.Entity<ContactType>().HasData(
            new ContactType { Id = 1, Name = "Lead", Description = "Contato inicial, ainda não qualificado", CreatedAt = seedDate },
            new ContactType { Id = 2, Name = "Cliente", Description = "Cliente ativo", CreatedAt = seedDate },
            new ContactType { Id = 3, Name = "Fornecedor", Description = "Fornecedor de serviços ou materiais", CreatedAt = seedDate },
            new ContactType { Id = 4, Name = "Relacionamento", Description = "Contato de relacionamento institucional", CreatedAt = seedDate }
        );

        // Contacts from artifact
        modelBuilder.Entity<Contact>().HasData(
            new Contact { Id = 1, Type = "Cliente", PersonType = "PJ", Name = "Construtora Horizonte", Company = "Horizonte Eng.", Cnpj = "12.345.678/0001-90", Phone = "(47) 3025-1100", Email = "contato@horizonte.com.br", City = "Joinville", State = "SC", Status = "Ativo", CreatedAt = seedDate },
            new Contact { Id = 2, Type = "Cliente", PersonType = "PJ", Name = "Incorporadora Della Giustina", Company = "Della Giustina", Cnpj = "98.765.432/0001-10", Phone = "(47) 3028-2200", Email = "empreendimentos@dellagiustina.com.br", City = "Joinville", State = "SC", Status = "Ativo", CreatedAt = seedDate },
            new Contact { Id = 3, Type = "Lead", PersonType = "PJ", Name = "RVLAR Empreendimentos", Company = "RVLAR", Phone = "(47) 3422-3300", Email = "comercial@rvlar.com.br", City = "Joinville", State = "SC", Status = "Novo", CreatedAt = seedDate },
            new Contact { Id = 4, Type = "Cliente", PersonType = "PJ", Name = "Engecorps Construções", Company = "Engecorps", Cnpj = "11.222.333/0001-44", Phone = "(47) 3433-4400", Email = "eng@engecorps.com.br", City = "Joinville", State = "SC", Status = "Ativo", CreatedAt = seedDate },
            new Contact { Id = 5, Type = "Cliente", PersonType = "PF", Name = "Roberto Della Giustina", Phone = "(47) 99901-2200", Email = "roberto@dellagiustina.com.br", City = "Joinville", State = "SC", Status = "Ativo", LinkedToId = 2, Position = "Diretor", Birthday = "1975-03-20", Cpf = "012.345.678-90", CreatedAt = seedDate },
            new Contact { Id = 6, Type = "Fornecedor", PersonType = "PJ", Name = "Topografia Sul", Company = "Topografia Sul Ltda.", Cnpj = "33.444.555/0001-66", Phone = "(47) 3455-6600", Email = "contato@toposul.com.br", City = "Joinville", State = "SC", Status = "Ativo", CreatedAt = seedDate },
            new Contact { Id = 7, Type = "Fornecedor", PersonType = "PF", Name = "Marcos Ferreira", Phone = "(47) 99912-3456", Email = "marcos@toposul.com.br", City = "Joinville", State = "SC", Status = "Ativo", LinkedToId = 6, Position = "Topógrafo responsável", Birthday = "1988-07-14", Cpf = "987.654.321-00", CreatedAt = seedDate },
            new Contact { Id = 8, Type = "Relacionamento", PersonType = "PF", Name = "João Silva - SAMA", Phone = "(47) 3423-1000", Email = "joao.silva@joinville.sc.gov.br", City = "Joinville", State = "SC", Status = "Ativo", Position = "Analista de Projetos", Birthday = "1982-11-05", CreatedAt = seedDate }
        );

        // Observations
        modelBuilder.Entity<ContactObservation>().HasData(
            new ContactObservation { Id = 1, ContactId = 5, Title = "Reunião inicial", Content = "Discutido interesse em novo empreendimento na região norte de Joinville.", Date = new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc), CreatedAt = seedDate },
            new ContactObservation { Id = 2, ContactId = 5, Title = "Follow-up telefônico", Content = "Roberto confirmou interesse. Solicitou orçamento para viabilidade.", Date = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc), CreatedAt = seedDate }
        );
    }
}
