using ERPlus.Modules.Reports.Application;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPlus.Modules.Reports;

public class ReportsModuleInstaller : IModuleInstaller
{
    public string ModuleName => "Reports";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<DashboardService>();
        services.AddScoped<PdfReportService>();
        services.AddScoped<CommercialDashboardService>();
        services.AddScoped<AdminDashboardService>();
        services.AddScoped<SupportDashboardService>();
        services.AddScoped<ProductionDashboardService>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/reports").WithTags("Reports").RequireAuthorization();

        group.MapGet("/dashboard", async (DashboardService svc) =>
            Results.Ok((await svc.GetDashboardAsync()).Data));

        group.MapGet("/dashboard/pdf", async (PdfReportService svc) =>
        {
            var result = await svc.GenerateDashboardPdfAsync();
            if (!result.IsSuccess) return Results.BadRequest(new { error = result.Error });
            return Results.File(result.Data!, "application/pdf", $"ERPlus_Dashboard_{DateTime.Now:yyyyMMdd_HHmm}.pdf");
        });

        group.MapGet("/commercial", async (CommercialDashboardService svc) =>
            Results.Ok((await svc.GetAsync()).Data));

        group.MapGet("/admin", async (AdminDashboardService svc) =>
            Results.Ok((await svc.GetAsync()).Data));

        group.MapGet("/support", async (SupportDashboardService svc) =>
            Results.Ok((await svc.GetAsync()).Data));

        group.MapGet("/production", async (ProductionDashboardService svc) =>
            Results.Ok((await svc.GetAsync()).Data));
    }
}
