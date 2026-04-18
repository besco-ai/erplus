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
        group.MapPut("/templates/{id:int}", async (int id, UpdateTemplateRequest req, DocumentsService svc) =>
        {
            var r = await svc.UpdateTemplateAsync(id, req);
            return r.IsSuccess ? Results.Ok(r.Data)
                : r.StatusCode == 404 ? Results.NotFound()
                : Results.BadRequest(new { error = r.Error });
        });
        group.MapDelete("/templates/{id:int}", async (int id, DocumentsService svc) =>
        {
            var r = await svc.DeleteTemplateAsync(id);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });
        group.MapPost("/templates/{id:int}/render", async (int id, RenderTemplateRequest req, DocumentsService svc) =>
        {
            var r = await svc.RenderTemplateAsync(id, req);
            return r.IsSuccess ? Results.Ok(r.Data)
                : r.StatusCode == 404 ? Results.NotFound()
                : Results.BadRequest(new { error = r.Error });
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
        SeedTemplates(db);
    }

    /// <summary>
    /// Popula 2 templates de orçamento e 1 de contrato estruturais do
    /// artefato (com placeholders {{cliente}}, {{valor_total}}, {{tabela_itens}}).
    /// Idempotente — só insere em DB vazio.
    /// </summary>
    private static void SeedTemplates(DocumentsDbContext db)
    {
        if (db.Templates.Any()) return;
        var now = DateTime.UtcNow;

        db.Templates.AddRange(
            new Domain.Entities.DocumentTemplate
            {
                Name = "Orçamento — Viabilidade Técnica",
                Tipo = "orcamento",
                Corpo =
                    "Proposta de viabilidade para o cliente {{cliente}}.\n\n" +
                    "Escopo: {{escopo}}\n" +
                    "Valor total: {{valor_total}}\n" +
                    "Forma de pagamento: {{forma_pagamento}}\n\n" +
                    "Validade: {{validade}}",
                Observacoes = "Template padrão para orçamentos de viabilidade.",
                CreatedAt = now
            },
            new Domain.Entities.DocumentTemplate
            {
                Name = "Orçamento — Laudo Geotécnico",
                Tipo = "orcamento",
                Corpo =
                    "Proposta de execução de laudo geotécnico — {{cliente}}.\n\n" +
                    "Quantidade de furos SPT: {{qtd_furos}}\n" +
                    "Endereço do terreno: {{endereco}}\n" +
                    "Valor total: {{valor_total}}\n" +
                    "Prazo de entrega: {{prazo}}",
                Observacoes = "Use {{qtd_furos}} para definir o preço pela unidade.",
                CreatedAt = now
            },
            new Domain.Entities.DocumentTemplate
            {
                Name = "Contrato — Prestação de Serviços",
                Tipo = "contrato",
                Corpo =
                    "CONTRATO DE PRESTAÇÃO DE SERVIÇOS TÉCNICOS\n\n" +
                    "Contratante: {{cliente}}\n" +
                    "Contratada: {{empresa_razao_social}} — CNPJ {{empresa_cnpj}}\n" +
                    "Objeto: {{objeto}}\n" +
                    "Valor: {{valor_total}}\n" +
                    "Vigência: de {{data_inicio}} a {{data_fim}}\n\n" +
                    "As partes, por este instrumento, acordam as condições acima e demais cláusulas.",
                Observacoes = "Preencha os campos {{empresa_razao_social}} e {{empresa_cnpj}} a partir das configurações da empresa.",
                CreatedAt = now
            }
        );
        db.SaveChanges();
    }
}
