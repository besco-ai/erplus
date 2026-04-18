using ERPlus.Modules.Commercial.Application;
using ERPlus.Modules.Commercial.Application.Services;
using ERPlus.Modules.Commercial.Domain.Entities;
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

        group.MapPut("/pipelines/{id:int}", async (int id, UpdatePipelineRequest req, DealService svc) =>
        {
            var r = await svc.UpdatePipelineAsync(id, req);
            return r.IsSuccess ? Results.Ok(r.Data)
                : r.StatusCode == 404 ? Results.NotFound()
                : Results.BadRequest(new { error = r.Error });
        });

        group.MapDelete("/pipelines/{id:int}", async (int id, DealService svc) =>
        {
            var r = await svc.DeletePipelineAsync(id);
            return r.IsSuccess ? Results.NoContent()
                : r.StatusCode == 404 ? Results.NotFound()
                : Results.BadRequest(new { error = r.Error });
        });

        group.MapPost("/pipelines/{id:int}/stages", async (int id, CreateStageRequest req, DealService svc) =>
        {
            var r = await svc.AddStageAsync(id, req);
            return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/stages/{id:int}", async (int id, UpdateStageRequest req, DealService svc) =>
        {
            var r = await svc.UpdateStageAsync(id, req);
            return r.IsSuccess ? Results.Ok(r.Data)
                : r.StatusCode == 404 ? Results.NotFound()
                : Results.BadRequest(new { error = r.Error });
        });

        group.MapDelete("/stages/{id:int}", async (int id, DealService svc) =>
        {
            var r = await svc.DeleteStageAsync(id);
            return r.IsSuccess ? Results.NoContent()
                : r.StatusCode == 404 ? Results.NotFound()
                : Results.BadRequest(new { error = r.Error });
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

        group.MapPost("/business-types", async (CreateBusinessTypeRequest r, CommercialDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(r.Name))
                return Results.BadRequest(new { error = "Nome é obrigatório" });
            var bt = new BusinessType { Name = r.Name.Trim(), Description = r.Description };
            db.BusinessTypes.Add(bt);
            await db.SaveChangesAsync();
            return Results.Created($"/api/commercial/business-types/{bt.Id}",
                new BusinessTypeDto(bt.Id, bt.Name, bt.Description));
        });

        group.MapPut("/business-types/{id:int}", async (int id, CreateBusinessTypeRequest r, CommercialDbContext db) =>
        {
            var bt = await db.BusinessTypes.FindAsync(id);
            if (bt is null) return Results.NotFound();
            if (!string.IsNullOrWhiteSpace(r.Name)) bt.Name = r.Name.Trim();
            if (r.Description is not null) bt.Description = r.Description;
            bt.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok(new BusinessTypeDto(bt.Id, bt.Name, bt.Description));
        });

        group.MapDelete("/business-types/{id:int}", async (int id, CommercialDbContext db) =>
        {
            var bt = await db.BusinessTypes.FindAsync(id);
            if (bt is null) return Results.NotFound();
            db.BusinessTypes.Remove(bt);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }

    public void UsePipeline(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CommercialDbContext>();
        db.Database.Migrate();
        SeedInitialPipelines(db);
        SeedTemplates(db);
    }

    /// <summary>
    /// Popula templates estruturais do artefato (2 diligências + 3 briefings)
    /// quando as tabelas respectivas estão vazias. Idempotente — não mexe em
    /// templates criados pelo usuário.
    /// </summary>
    private static void SeedTemplates(CommercialDbContext db)
    {
        var now = DateTime.UtcNow;

        if (!db.DiligenceTemplates.Any())
        {
            db.DiligenceTemplates.AddRange(
                new Domain.Entities.DiligenceTemplate
                {
                    Name = "Due Diligence — Viabilidade",
                    BusinessTypeId = null,
                    ItemsJson = "[" +
                        "{\"title\":\"Matrícula atualizada do imóvel\",\"required\":true}," +
                        "{\"title\":\"Certidão de ônus reais\",\"required\":true}," +
                        "{\"title\":\"Consulta de parâmetros urbanísticos (SAMA)\",\"required\":true}," +
                        "{\"title\":\"Verificação de zoneamento (LOT)\",\"required\":true}," +
                        "{\"title\":\"Análise de restrições ambientais\",\"required\":false}," +
                        "{\"title\":\"Certidão de uso do solo\",\"required\":true}," +
                        "{\"title\":\"Consulta de viabilidade junto à SAMA\",\"required\":true}" +
                        "]",
                    CreatedAt = now
                },
                new Domain.Entities.DiligenceTemplate
                {
                    Name = "Due Diligence — Laudo Geotécnico",
                    BusinessTypeId = null,
                    ItemsJson = "[" +
                        "{\"title\":\"Autorização de acesso ao terreno\",\"required\":true}," +
                        "{\"title\":\"Planta de localização do terreno\",\"required\":true}," +
                        "{\"title\":\"Projeto arquitetônico (se houver)\",\"required\":false}," +
                        "{\"title\":\"Relatório prévio de sondagem\",\"required\":false}," +
                        "{\"title\":\"Definição de quantidade de furos SPT\",\"required\":true}" +
                        "]",
                    CreatedAt = now
                }
            );
        }

        if (!db.BriefingTemplates.Any())
        {
            db.BriefingTemplates.AddRange(
                new Domain.Entities.BriefingTemplate
                {
                    Name = "Residencial Multifamiliar",
                    ItemsJson = "[" +
                        "{\"title\":\"Número de unidades previstas\",\"required\":true}," +
                        "{\"title\":\"Área média por unidade (m²)\",\"required\":true}," +
                        "{\"title\":\"Público-alvo\",\"required\":false}," +
                        "{\"title\":\"Padrão construtivo\",\"required\":true}," +
                        "{\"title\":\"Áreas comuns desejadas\",\"required\":false}" +
                        "]",
                    CreatedAt = now
                },
                new Domain.Entities.BriefingTemplate
                {
                    Name = "Residencial Unifamiliar",
                    ItemsJson = "[" +
                        "{\"title\":\"Programa de necessidades (dormitórios, suítes, etc.)\",\"required\":true}," +
                        "{\"title\":\"Número de pavimentos\",\"required\":true}," +
                        "{\"title\":\"Estilo arquitetônico desejado\",\"required\":false}," +
                        "{\"title\":\"Orçamento estimado\",\"required\":true}" +
                        "]",
                    CreatedAt = now
                },
                new Domain.Entities.BriefingTemplate
                {
                    Name = "Comercial / Misto",
                    ItemsJson = "[" +
                        "{\"title\":\"Atividade prevista\",\"required\":true}," +
                        "{\"title\":\"Área total desejada (m²)\",\"required\":true}," +
                        "{\"title\":\"Número de vagas de estacionamento\",\"required\":true}," +
                        "{\"title\":\"Necessidades específicas (carga/descarga, fachada ativa, etc.)\",\"required\":false}" +
                        "]",
                    CreatedAt = now
                }
            );
        }

        db.SaveChanges();
    }

    /// <summary>
    /// Popula os 3 pipelines padrão do artefato quando o módulo Commercial
    /// nasce sem nenhum pipeline cadastrado. São considerados estrutura
    /// (não demo data): o sistema precisa de ao menos um pipeline para os
    /// negócios se encaixarem, e esses três refletem o fluxo descrito no
    /// artefato de UI. Uma vez que exista qualquer pipeline, esta rotina
    /// é idempotente — não altera nada.
    /// </summary>
    private static void SeedInitialPipelines(CommercialDbContext db)
    {
        if (db.Pipelines.Any()) return;

        var now = DateTime.UtcNow;
        var atendimento = new Domain.Entities.Pipeline { Name = "Atendimento Inicial", Order = 0, CreatedAt = now };
        var consultoria = new Domain.Entities.Pipeline { Name = "Consultoria & Captação", Order = 1, CreatedAt = now };
        var definicao   = new Domain.Entities.Pipeline { Name = "Definição & Contratação", Order = 2, CreatedAt = now };
        db.Pipelines.AddRange(atendimento, consultoria, definicao);

        db.PipelineStages.AddRange(
            new Domain.Entities.PipelineStage { Pipeline = atendimento, Name = "Contato inicial",  Order = 0, AutoTasksJson = "[\"Primeiro contato\",\"Enviar apresentação\"]", CreatedAt = now },
            new Domain.Entities.PipelineStage { Pipeline = atendimento, Name = "Envio de proposta", Order = 1, AutoTasksJson = "[\"Elaborar proposta\"]", CreatedAt = now },
            new Domain.Entities.PipelineStage { Pipeline = atendimento, Name = "Follow-up",        Order = 2, CreatedAt = now },
            new Domain.Entities.PipelineStage { Pipeline = atendimento, Name = "Negociação",       Order = 3, CreatedAt = now },
            new Domain.Entities.PipelineStage { Pipeline = atendimento, Name = "Fechamento",       Order = 4, AutoTasksJson = "[\"Gerar contrato\"]", CreatedAt = now },

            new Domain.Entities.PipelineStage { Pipeline = consultoria, Name = "Consulta inicial", Order = 0, AutoTasksJson = "[\"Agendar reunião\"]", CreatedAt = now },
            new Domain.Entities.PipelineStage { Pipeline = consultoria, Name = "Análise técnica",  Order = 1, CreatedAt = now },
            new Domain.Entities.PipelineStage { Pipeline = consultoria, Name = "Entrega",          Order = 2, CreatedAt = now },

            new Domain.Entities.PipelineStage { Pipeline = definicao,   Name = "Briefing",         Order = 0, AutoTasksJson = "[\"Coletar briefing\"]", CreatedAt = now }
        );

        db.SaveChanges();
    }
}
