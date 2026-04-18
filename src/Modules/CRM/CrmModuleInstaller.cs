using ERPlus.Modules.CRM.Application;
using ERPlus.Modules.CRM.Application.Services;
using ERPlus.Modules.CRM.Infrastructure.Data;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPlus.Modules.CRM;

public class CrmModuleInstaller : IModuleInstaller
{
    public string ModuleName => "CRM";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<CrmDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npg => npg.MigrationsHistoryTable("__EFMigrationsHistory", CrmDbContext.Schema)));

        services.AddScoped<ContactService>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/crm").WithTags("CRM").RequireAuthorization();

        // ── Contacts ──
        group.MapGet("/contacts", async (
            string? search, string? type, string? personType, string? status,
            string? city, string? state, int? page, int? pageSize,
            ContactService svc) =>
        {
            var result = await svc.GetAllAsync(search, type, personType, status, city, state,
                page ?? 1, pageSize ?? 50);
            return Results.Ok(result.Data);
        });

        group.MapGet("/contacts/{id:int}", async (int id, ContactService svc) =>
        {
            var result = await svc.GetByIdAsync(id);
            return result.IsSuccess ? Results.Ok(result.Data) : Results.NotFound(new { error = result.Error });
        });

        group.MapPost("/contacts", async (CreateContactRequest request, ContactService svc) =>
        {
            var result = await svc.CreateAsync(request);
            return result.IsSuccess
                ? Results.Created($"/api/crm/contacts/{result.Data!.Id}", result.Data)
                : Results.BadRequest(new { error = result.Error });
        });

        group.MapPut("/contacts/{id:int}", async (int id, UpdateContactRequest request, ContactService svc) =>
        {
            var result = await svc.UpdateAsync(id, request);
            return result.IsSuccess
                ? Results.Ok(result.Data)
                : result.StatusCode == 404
                    ? Results.NotFound(new { error = result.Error })
                    : Results.BadRequest(new { error = result.Error });
        });

        group.MapDelete("/contacts/{id:int}", async (int id, ContactService svc) =>
        {
            var result = await svc.DeleteAsync(id);
            return result.IsSuccess ? Results.NoContent() : Results.NotFound(new { error = result.Error });
        });

        // ── Observations ──
        group.MapPost("/contacts/{id:int}/observations", async (int id, CreateObservationRequest request, ContactService svc) =>
        {
            var result = await svc.AddObservationAsync(id, request);
            return result.IsSuccess
                ? Results.Created($"/api/crm/contacts/{id}", result.Data)
                : Results.BadRequest(new { error = result.Error });
        });

        group.MapDelete("/contacts/{contactId:int}/observations/{obsId:int}", async (int contactId, int obsId, ContactService svc) =>
        {
            var result = await svc.DeleteObservationAsync(contactId, obsId);
            return result.IsSuccess ? Results.NoContent() : Results.NotFound(new { error = result.Error });
        });

        // ── Contact Types ──
        group.MapGet("/contact-types", async (ContactService svc) =>
        {
            var result = await svc.GetTypesAsync();
            return Results.Ok(result.Data);
        });

        group.MapPost("/contact-types", async (CreateContactTypeRequest request, ContactService svc) =>
        {
            var result = await svc.CreateTypeAsync(request);
            return result.IsSuccess
                ? Results.Created($"/api/crm/contact-types/{result.Data!.Id}", result.Data)
                : Results.BadRequest(new { error = result.Error });
        });
    }

    public void UsePipeline(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CrmDbContext>();
        db.Database.Migrate();
        SeedContactTypes(db);
    }

    /// <summary>
    /// Popula os 4 tipos de contato estruturais do artefato (Lead, Cliente,
    /// Fornecedor, Relacionamento) quando a tabela está vazia. Idempotente.
    /// </summary>
    private static void SeedContactTypes(CrmDbContext db)
    {
        if (db.ContactTypes.Any()) return;
        var now = DateTime.UtcNow;
        db.ContactTypes.AddRange(
            new Domain.Entities.ContactType { Name = "Lead",           Description = "Contato inicial, ainda não qualificado", CreatedAt = now },
            new Domain.Entities.ContactType { Name = "Cliente",        Description = "Cliente ativo",                           CreatedAt = now },
            new Domain.Entities.ContactType { Name = "Fornecedor",     Description = "Fornecedor de serviços ou materiais",     CreatedAt = now },
            new Domain.Entities.ContactType { Name = "Relacionamento", Description = "Contato de relacionamento institucional", CreatedAt = now }
        );
        db.SaveChanges();
    }
}
