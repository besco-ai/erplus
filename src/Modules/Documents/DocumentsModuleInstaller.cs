using ERPlus.Modules.Documents.Application;
using ERPlus.Modules.Documents.Infrastructure.Data;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPlus.Modules.Documents;

public class DocumentsModuleInstaller : IModuleInstaller
{
    public string ModuleName => "Documents";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<DocumentsDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npg => npg.MigrationsHistoryTable("__EFMigrationsHistory", DocumentsDbContext.Schema)));
        services.AddScoped<DocumentsService>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/documents").WithTags("Documents").RequireAuthorization();

        group.MapGet("/attachments", async (string entityType, int entityId, DocumentsService svc) =>
            Results.Ok((await svc.GetAttachmentsAsync(entityType, entityId)).Data));
        group.MapPost("/attachments", async (CreateAttachmentRequest req, DocumentsService svc) =>
        {
            var r = await svc.AddAttachmentAsync(req); return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });
        group.MapDelete("/attachments/{id:int}", async (int id, DocumentsService svc) =>
        {
            var r = await svc.DeleteAttachmentAsync(id); return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });

        group.MapGet("/templates", async (string? tipo, DocumentsService svc) => Results.Ok((await svc.GetTemplatesAsync(tipo)).Data));
        group.MapPost("/templates", async (CreateTemplateRequest req, DocumentsService svc) =>
        {
            var r = await svc.CreateTemplateAsync(req); return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapGet("/timeline", async (int? dealId, int? projectId, DocumentsService svc) =>
            Results.Ok((await svc.GetTimelineAsync(dealId, projectId)).Data));
        group.MapPost("/timeline", async (CreateTimelineRequest req, DocumentsService svc) =>
        {
            var r = await svc.AddTimelineAsync(req); return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        // Tickets (Suporte)
        group.MapGet("/tickets", async (string? status, int? createdById, DocumentsService svc) =>
            Results.Ok((await svc.GetTicketsAsync(status, createdById)).Data));
        group.MapPost("/tickets", async (CreateTicketRequest req, HttpContext ctx, DocumentsService svc) =>
        {
            var userId = int.TryParse(ctx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 1;
            var r = await svc.CreateTicketAsync(req, userId);
            return r.IsSuccess ? Results.Created($"/api/documents/tickets/{r.Data!.Id}", r.Data) : Results.BadRequest(new { error = r.Error });
        });
        group.MapPut("/tickets/{id:int}", async (int id, UpdateTicketRequest req, DocumentsService svc) =>
        {
            var r = await svc.UpdateTicketAsync(id, req);
            return r.IsSuccess ? Results.Ok(r.Data) : r.StatusCode == 404 ? Results.NotFound() : Results.BadRequest(new { error = r.Error });
        });
        group.MapDelete("/tickets/{id:int}", async (int id, DocumentsService svc) =>
        {
            var r = await svc.DeleteTicketAsync(id); return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });
    }

    public void UsePipeline(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DocumentsDbContext>();
        db.Database.Migrate();
    }
}
