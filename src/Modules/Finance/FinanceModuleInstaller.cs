using ERPlus.Modules.Finance.Application;
using ERPlus.Modules.Finance.Application.Services;
using ERPlus.Modules.Finance.Infrastructure.Data;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPlus.Modules.Finance;

public class FinanceModuleInstaller : IModuleInstaller
{
    public string ModuleName => "Finance";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<FinanceDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npg => npg.MigrationsHistoryTable("__EFMigrationsHistory", FinanceDbContext.Schema)));

        services.AddScoped<FinanceService>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/finance").WithTags("Finance").RequireAuthorization();

        // Summary
        group.MapGet("/summary", async (FinanceService svc) =>
            Results.Ok((await svc.GetSummaryAsync()).Data));

        // Entries
        group.MapGet("/entries", async (string? type, string? status, int? costCenterId, FinanceService svc) =>
            Results.Ok((await svc.GetEntriesAsync(type, status, costCenterId)).Data));

        group.MapPost("/entries", async (CreateEntryRequest req, FinanceService svc) =>
        {
            var r = await svc.CreateEntryAsync(req);
            return r.IsSuccess ? Results.Created($"/api/finance/entries/{r.Data!.Id}", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/entries/{id:int}", async (int id, UpdateEntryRequest req, FinanceService svc) =>
        {
            var r = await svc.UpdateEntryAsync(id, req);
            return r.IsSuccess ? Results.Ok(r.Data) : r.StatusCode == 404 ? Results.NotFound() : Results.BadRequest(new { error = r.Error });
        });

        group.MapDelete("/entries/{id:int}", async (int id, FinanceService svc) =>
        {
            var r = await svc.DeleteEntryAsync(id);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });

        // Accounts Receivable
        group.MapGet("/receivables", async (string? status, FinanceService svc) =>
            Results.Ok((await svc.GetReceivablesAsync(status)).Data));

        group.MapPost("/receivables", async (CreateReceivableRequest req, FinanceService svc) =>
        {
            var r = await svc.CreateReceivableAsync(req);
            return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/receivables/{id:int}", async (int id, UpdateReceivableRequest req, FinanceService svc) =>
        {
            var r = await svc.UpdateReceivableAsync(id, req);
            return r.IsSuccess ? Results.Ok(new { message = "Atualizado" }) : Results.NotFound();
        });

        group.MapDelete("/receivables/{id:int}", async (int id, FinanceService svc) =>
        {
            var r = await svc.DeleteReceivableAsync(id);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });

        // Accounts Payable
        group.MapGet("/payables", async (string? status, FinanceService svc) =>
            Results.Ok((await svc.GetPayablesAsync(status)).Data));

        group.MapPost("/payables", async (CreatePayableRequest req, FinanceService svc) =>
        {
            var r = await svc.CreatePayableAsync(req);
            return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/payables/{id:int}", async (int id, UpdatePayableRequest req, FinanceService svc) =>
        {
            var r = await svc.UpdatePayableAsync(id, req);
            return r.IsSuccess ? Results.Ok(new { message = "Atualizado" }) : Results.NotFound();
        });

        group.MapDelete("/payables/{id:int}", async (int id, FinanceService svc) =>
        {
            var r = await svc.DeletePayableAsync(id);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });

        // Cost Centers
        group.MapGet("/cost-centers", async (FinanceService svc) =>
            Results.Ok((await svc.GetCostCentersAsync()).Data));

        group.MapPost("/cost-centers", async (CreateCostCenterRequest req, FinanceService svc) =>
        {
            var r = await svc.CreateCostCenterAsync(req);
            return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        // Bank Accounts
        group.MapGet("/bank-accounts", async (FinanceService svc) =>
            Results.Ok((await svc.GetBankAccountsAsync()).Data));

        group.MapPost("/bank-accounts", async (CreateBankAccountRequest req, FinanceService svc) =>
        {
            var r = await svc.CreateBankAccountAsync(req);
            return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });
    }

    public void UsePipeline(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
        db.Database.Migrate();
    }
}
