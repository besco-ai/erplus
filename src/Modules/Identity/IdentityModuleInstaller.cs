using ERPlus.Modules.Identity.Application.Services;
using ERPlus.Modules.Identity.Domain.Entities;
using ERPlus.Modules.Identity.Endpoints;
using ERPlus.Modules.Identity.Infrastructure;
using ERPlus.Modules.Identity.Infrastructure.Data;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPlus.Modules.Identity;

public class IdentityModuleInstaller : IModuleInstaller
{
    public string ModuleName => "Identity";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<IdentityDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npg => npg.MigrationsHistoryTable("__EFMigrationsHistory", IdentityDbContext.Schema)));

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<AuthService>();
        services.AddScoped<UserService>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        IdentityEndpoints.Map(endpoints);
    }

    public void UsePipeline(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        db.Database.Migrate();

        if (!db.Users.IgnoreQueryFilters().Any())
        {
            var now = DateTime.UtcNow;
            db.Users.AddRange(
                new User
                {
                    Name = "Giovanio Gonçalves",
                    Email = "giovanio@egconsultorias.com.br",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    Role = "Operador Master",
                    Initials = "GG",
                    IsActive = true,
                    CreatedAt = now
                },
                new User
                {
                    Name = "Carlos Silva",
                    Email = "carlos@egconsultorias.com.br",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("user123"),
                    Role = "Colaborador",
                    Initials = "CS",
                    IsActive = true,
                    CreatedAt = now
                }
            );
            db.SaveChanges();
        }
    }
}
