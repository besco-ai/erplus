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
            e.Property(x => x.Cellphone).HasMaxLength(20);
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
    }
}
