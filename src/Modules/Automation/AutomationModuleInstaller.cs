using ERPlus.Modules.Automation.Application;
using ERPlus.Modules.Automation.Infrastructure.Data;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPlus.Modules.Automation;

public class AutomationModuleInstaller : IModuleInstaller
{
    public string ModuleName => "Automation";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AutomationDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npg => npg.MigrationsHistoryTable("__EFMigrationsHistory", AutomationDbContext.Schema)));
        services.AddScoped<AutomationService>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/automation").WithTags("Automation").RequireAuthorization();

        group.MapGet("/rules", async (AutomationService svc) => Results.Ok((await svc.GetAllAsync()).Data));
        group.MapPost("/rules", async (CreateRuleRequest req, AutomationService svc) =>
        {
            var r = await svc.CreateAsync(req); return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });
        group.MapPut("/rules/{id:int}", async (int id, UpdateRuleRequest req, AutomationService svc) =>
        {
            var r = await svc.UpdateAsync(id, req); return r.IsSuccess ? Results.Ok(new { message = "Atualizado" }) : Results.NotFound();
        });
        group.MapDelete("/rules/{id:int}", async (int id, AutomationService svc) =>
        {
            var r = await svc.DeleteAsync(id); return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });
    }

    public void UsePipeline(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AutomationDbContext>();
        db.Database.Migrate();
    }
}
