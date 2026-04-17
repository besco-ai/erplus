using ERPlus.Modules.Config.Application;
using ERPlus.Modules.Config.Infrastructure.Data;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPlus.Modules.Config;

public class ConfigModuleInstaller : IModuleInstaller
{
    public string ModuleName => "Config";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ConfigDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npg => npg.MigrationsHistoryTable("__EFMigrationsHistory", ConfigDbContext.Schema)));
        services.AddScoped<ConfigService>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/config").WithTags("Config").RequireAuthorization();

        group.MapGet("/services", async (ConfigService svc) => Results.Ok((await svc.GetServicesAsync()).Data));
        group.MapPost("/services", async (CreateServiceItemRequest req, ConfigService svc) =>
        {
            var r = await svc.CreateServiceAsync(req); return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });
        group.MapPut("/services/{id:int}", async (int id, UpdateServiceItemRequest req, ConfigService svc) =>
        {
            var r = await svc.UpdateServiceAsync(id, req); return r.IsSuccess ? Results.Ok(r.Data) : Results.NotFound();
        });
        group.MapDelete("/services/{id:int}", async (int id, ConfigService svc) =>
        {
            var r = await svc.DeleteServiceAsync(id); return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });

        group.MapGet("/settings", async (ConfigService svc) => Results.Ok((await svc.GetSettingsAsync()).Data));
        group.MapPost("/settings", async (SetSettingRequest req, ConfigService svc) =>
        {
            var r = await svc.SetSettingAsync(req); return Results.Ok(r.Data);
        });
    }

    public void UsePipeline(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ConfigDbContext>();
        db.Database.Migrate();
    }
}
