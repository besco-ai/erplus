using ERPlus.Modules.Projects.Application;
using ERPlus.Modules.Projects.Application.Services;
using ERPlus.Modules.Projects.Infrastructure.Data;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPlus.Modules.Projects;

public class ProjectsModuleInstaller : IModuleInstaller
{
    public string ModuleName => "Projects";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ProjectsDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npg => npg.MigrationsHistoryTable("__EFMigrationsHistory", ProjectsDbContext.Schema)));

        services.AddScoped<ProjectService>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/projects").WithTags("Projects").RequireAuthorization();

        // Projects
        group.MapGet("/", async (int? pipelineId, int? stageId, int? clientId, ProjectService svc) =>
            Results.Ok((await svc.GetAllAsync(pipelineId, stageId, clientId)).Data));

        group.MapGet("/{id:int}", async (int id, ProjectService svc) =>
        {
            var r = await svc.GetByIdAsync(id);
            return r.IsSuccess ? Results.Ok(r.Data) : Results.NotFound(new { error = r.Error });
        });

        group.MapPost("/", async (CreateProjectRequest req, ProjectService svc) =>
        {
            var r = await svc.CreateAsync(req);
            return r.IsSuccess ? Results.Created($"/api/projects/{r.Data!.Id}", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/{id:int}", async (int id, UpdateProjectRequest req, ProjectService svc) =>
        {
            var r = await svc.UpdateAsync(id, req);
            return r.IsSuccess ? Results.Ok(r.Data) : r.StatusCode == 404 ? Results.NotFound() : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/{id:int}/move", async (int id, MoveProjectRequest req, ProjectService svc) =>
        {
            var r = await svc.MoveAsync(id, req);
            return r.IsSuccess ? Results.Ok(new { message = "Movido" }) : Results.BadRequest(new { error = r.Error });
        });

        group.MapDelete("/{id:int}", async (int id, ProjectService svc) =>
        {
            var r = await svc.DeleteAsync(id);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });

        // Pipelines
        group.MapGet("/pipelines", async (ProjectService svc) =>
            Results.Ok((await svc.GetPipelinesAsync()).Data));

        group.MapPost("/pipelines", async (CreateProjectPipelineRequest req, ProjectService svc) =>
        {
            var r = await svc.CreatePipelineAsync(req);
            return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPost("/pipelines/{id:int}/stages", async (int id, CreateProjectStageRequest req, ProjectService svc) =>
        {
            var r = await svc.AddStageAsync(id, req);
            return r.IsSuccess ? Results.Created("", r.Data) : Results.BadRequest(new { error = r.Error });
        });
    }

    public void UsePipeline(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ProjectsDbContext>();
        db.Database.Migrate();
    }
}
