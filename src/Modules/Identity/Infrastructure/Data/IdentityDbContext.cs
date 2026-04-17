using ERPlus.Modules.Identity.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Identity.Infrastructure.Data;

public class IdentityDbContext : DbContext
{
    public const string Schema = "identity";

    public DbSet<User> Users => Set<User>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public IdentityDbContext(DbContextOptions<IdentityDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            e.Property(x => x.Role).HasMaxLength(50).IsRequired();
            e.Property(x => x.Initials).HasMaxLength(5);
            e.HasQueryFilter(x => !x.IsDeleted);
        });

        modelBuilder.Entity<RolePermission>(e =>
        {
            e.ToTable("role_permissions");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.RoleName, x.Resource }).IsUnique();
            e.Property(x => x.RoleName).HasMaxLength(50).IsRequired();
            e.Property(x => x.Resource).HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.ToTable("refresh_tokens");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Token).IsUnique();
            e.Property(x => x.Token).HasMaxLength(500).IsRequired();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        // Users are seeded at runtime by IdentityModuleInstaller so BCrypt hashes
        // are generated dynamically and match the documented admin123/user123 passwords.

        // Seed permissions matching the artifact's initPermissions
        var resources = new[] { "dashboard", "agenda", "contatos", "financeiro", "comercial",
            "empreendimentos", "producao", "suporte", "configuracoes", "relatorios" };

        var id = 1;
        // Operador Master — full access
        foreach (var resource in resources)
        {
            modelBuilder.Entity<RolePermission>().HasData(new RolePermission
            {
                Id = id++, RoleName = "Operador Master", Resource = resource,
                CanView = true, CanEdit = true, CanDelete = true, CreatedAt = seedDate
            });
        }

        // Colaborador — limited access
        var colabEdit = new HashSet<string> { "dashboard", "agenda", "contatos", "comercial", "empreendimentos", "producao", "suporte" };
        foreach (var resource in resources)
        {
            var canView = colabEdit.Contains(resource);
            modelBuilder.Entity<RolePermission>().HasData(new RolePermission
            {
                Id = id++, RoleName = "Colaborador", Resource = resource,
                CanView = canView, CanEdit = canView, CanDelete = false, CreatedAt = seedDate
            });
        }

        // Visitante — view-only dashboard + empreendimentos
        var visitView = new HashSet<string> { "dashboard", "empreendimentos" };
        foreach (var resource in resources)
        {
            modelBuilder.Entity<RolePermission>().HasData(new RolePermission
            {
                Id = id++, RoleName = "Visitante", Resource = resource,
                CanView = visitView.Contains(resource), CanEdit = false, CanDelete = false, CreatedAt = seedDate
            });
        }
    }
}
