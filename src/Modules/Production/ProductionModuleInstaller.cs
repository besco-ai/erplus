using ERPlus.Modules.Production.Application;
using ERPlus.Modules.Production.Application.Services;
using ERPlus.Modules.Production.Infrastructure.Data;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPlus.Modules.Production;

public class ProductionModuleInstaller : IModuleInstaller
{
    public string ModuleName => "Production";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ProductionDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npg => npg.MigrationsHistoryTable("__EFMigrationsHistory", ProductionDbContext.Schema)));
        services.AddScoped<ProductionService>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/production").WithTags("Production").RequireAuthorization();

        group.MapGet("/summary", async (ProductionService svc) => Results.Ok((await svc.GetSummaryAsync()).Data));

        group.MapGet("/items", async (string? category, string? status, int? responsibleId, int? projectId, ProductionService svc) =>
            Results.Ok((await svc.GetAllAsync(category, status, responsibleId, projectId)).Data));

        group.MapPost("/items", async (CreateProductionItemRequest req, ProductionService svc) =>
        {
            var r = await svc.CreateAsync(req);
            return r.IsSuccess ? Results.Created($"/api/production/items/{r.Data!.Id}", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/items/{id:int}", async (int id, UpdateProductionItemRequest req, ProductionService svc) =>
        {
            var r = await svc.UpdateAsync(id, req);
            return r.IsSuccess ? Results.Ok(r.Data) : r.StatusCode == 404 ? Results.NotFound() : Results.BadRequest(new { error = r.Error });
        });

        group.MapDelete("/items/{id:int}", async (int id, ProductionService svc) =>
        {
            var r = await svc.DeleteAsync(id);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });

        group.MapGet("/item-types", async (string? categoria, ProductionService svc) =>
            Results.Ok((await svc.GetItemTypesAsync(categoria)).Data));

        group.MapPost("/item-types", async (CreateItemTypeRequest req, ProductionService svc) =>
        {
            var r = await svc.CreateItemTypeAsync(req);
            return r.IsSuccess ? Results.Created($"/api/production/item-types/{r.Data!.Id}", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/item-types/{id:int}", async (int id, UpdateItemTypeRequest req, ProductionService svc) =>
        {
            var r = await svc.UpdateItemTypeAsync(id, req);
            return r.IsSuccess ? Results.Ok(r.Data) : r.StatusCode == 404 ? Results.NotFound() : Results.BadRequest(new { error = r.Error });
        });

        group.MapDelete("/item-types/{id:int}", async (int id, ProductionService svc) =>
        {
            var r = await svc.DeleteItemTypeAsync(id);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });
    }

    public void UsePipeline(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ProductionDbContext>();
        db.Database.Migrate();
    }
}
