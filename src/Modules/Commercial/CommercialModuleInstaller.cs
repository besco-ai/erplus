using ERPlus.Modules.Commercial.Application;
using ERPlus.Modules.Commercial.Application.Services;
using ERPlus.Modules.Commercial.Infrastructure.Data;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPlus.Modules.Commercial;

public class CommercialModuleInstaller : IModuleInstaller
{
    public string ModuleName => "Commercial";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<CommercialDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npg => npg.MigrationsHistoryTable("__EFMigrationsHistory", CommercialDbContext.Schema)));

        services.AddScoped<DealService>();
        services.AddScoped<QuoteService>();
        services.AddScoped<ContractService>();
        services.AddScoped<AtaService>();
        services.AddScoped<DiligenceService>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/commercial").WithTags("Commercial").RequireAuthorization();

        // ── Deals ──
        group.MapGet("/deals", async (int? pipelineId, int? stageId, string? status, int? responsibleId, DealService svc) =>
        {
            var r = await svc.GetAllAsync(pipelineId, stageId, status, responsibleId);
            return Results.Ok(r.Data);
        });

        group.MapGet("/deals/{id:int}", async (int id, DealService svc) =>
        {
            var r = await svc.GetByIdAsync(id);
            return r.IsSuccess ? Results.Ok(r.Data) : Results.NotFound(new { error = r.Error });
        });

        group.MapPost("/deals", async (CreateDealRequest req, DealService svc) =>
        {
            var r = await svc.CreateAsync(req);
            return r.IsSuccess ? Results.Created($"/api/commercial/deals/{r.Data!.Id}", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/deals/{id:int}", async (int id, UpdateDealRequest req, DealService svc) =>
        {
            var r = await svc.UpdateAsync(id, req);
            return r.IsSuccess ? Results.Ok(r.Data) : r.StatusCode == 404 ? Results.NotFound() : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/deals/{id:int}/move", async (int id, MoveDealRequest req, DealService svc) =>
        {
            var r = await svc.MoveAsync(id, req);
            return r.IsSuccess ? Results.Ok(new { message = "Movido" }) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPost("/deals/{id:int}/win", async (int id, DealService svc) =>
        {
            var r = await svc.WinAsync(id);
            return r.IsSuccess ? Results.Ok(new { message = "Negócio ganho" }) : Results.NotFound();
        });

        group.MapPost("/deals/{id:int}/lose", async (int id, DealService svc) =>
        {
            var r = await svc.LoseAsync(id);
            return r.IsSuccess ? Results.Ok(new { message = "Negócio perdido" }) : Results.NotFound();
        });

        group.MapDelete("/deals/{id:int}", async (int id, DealService svc) =>
        {
            var r = await svc.DeleteAsync(id);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });

        // ── Pipelines ──
        group.MapGet("/pipelines", async (DealService svc) =>
        {
            var r = await svc.GetPipelinesAsync();
            return Results.Ok(r.Data);
        });

        group.MapPost("/pipelines", async (CreatePipelineRequest req, DealService svc) =>
        {
            var r = await svc.CreatePipelineAsync(req);
            return r.IsSuccess ? Results.Created($"/api/commercial/pipelines/{r.Data!.Id}", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPost("/pipelines/{id:int}/stages", async (int id, CreateStageRequest req, DealService svc) =>
        {
            var r = await svc.AddStageAsync(id, req);
            return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        // ── Quotes ──
        group.MapGet("/quotes", async (int? dealId, QuoteService svc) =>
        {
            var r = await svc.GetAllAsync(dealId);
            return Results.Ok(r.Data);
        });

        group.MapPost("/quotes", async (CreateQuoteRequest req, QuoteService svc) =>
        {
            var r = await svc.CreateAsync(req);
            return r.IsSuccess ? Results.Created($"/api/commercial/quotes/{r.Data!.Id}", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/quotes/{id:int}/status", async (int id, UpdateQuoteStatusRequest req, QuoteService svc) =>
        {
            var r = await svc.UpdateStatusAsync(id, req);
            return r.IsSuccess ? Results.Ok(r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapDelete("/quotes/{id:int}", async (int id, QuoteService svc) =>
        {
            var r = await svc.DeleteAsync(id);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });

        // ── Contracts ──
        group.MapGet("/contracts", async (int? dealId, ContractService svc) =>
        {
            var r = await svc.GetAllAsync(dealId);
            return Results.Ok(r.Data);
        });

        group.MapPost("/contracts", async (CreateContractRequest req, ContractService svc) =>
        {
            var r = await svc.CreateAsync(req);
            return r.IsSuccess ? Results.Created($"/api/commercial/contracts/{r.Data!.Id}", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        // ── Atas ──
        group.MapPost("/deals/{id:int}/atas", async (int id, CreateAtaRequest req, AtaService svc) =>
        {
            var r = await svc.CreateAsync(id, req);
            return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapDelete("/deals/{dealId:int}/atas/{ataId:int}", async (int dealId, int ataId, AtaService svc) =>
        {
            var r = await svc.DeleteAsync(dealId, ataId);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });

        // ── Diligence ──
        group.MapPost("/deals/{id:int}/diligences", async (int id, LoadDiligenceRequest req, DiligenceService svc) =>
        {
            var r = await svc.LoadAsync(id, req);
            return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/deals/{dealId:int}/diligences/{dilId:int}", async (int dealId, int dilId, UpdateDiligenceItemsRequest req, DiligenceService svc) =>
        {
            var r = await svc.UpdateItemsAsync(dealId, dilId, req);
            return r.IsSuccess ? Results.Ok(new { message = "Atualizado" }) : Results.NotFound();
        });

        group.MapGet("/diligence-templates", async (DiligenceService svc) => Results.Ok((await svc.GetTemplatesAsync()).Data));

        // ── Briefings ──
        group.MapPost("/deals/{id:int}/briefings", async (int id, LoadBriefingRequest req, DiligenceService svc) =>
        {
            var r = await svc.LoadBriefingAsync(id, req);
            return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapGet("/briefing-templates", async (DiligenceService svc) => Results.Ok((await svc.GetBriefingTemplatesAsync()).Data));

        // ── Business Types ──
        group.MapGet("/deals/{id:int}/timeline", async (int id, DealService svc) =>
        {
            var r = await svc.GetTimelineAsync(id);
            return r.IsSuccess ? Results.Ok(r.Data) : Results.NotFound();
        });

        group.MapGet("/business-types", async (CommercialDbContext db) =>
            Results.Ok(await db.BusinessTypes.OrderBy(b => b.Name)
                .Select(b => new BusinessTypeDto(b.Id, b.Name, b.Description)).ToListAsync()));
    }

    public void UsePipeline(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CommercialDbContext>();
        db.Database.Migrate();
    }
}
