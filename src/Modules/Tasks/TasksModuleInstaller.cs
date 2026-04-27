using ERPlus.Modules.Tasks.Application;
using ERPlus.Modules.Tasks.Application.Services;
using ERPlus.Modules.Tasks.Infrastructure.Data;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPlus.Modules.Tasks;

public class TasksModuleInstaller : IModuleInstaller
{
    public string ModuleName => "Tasks";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<TasksDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npg => npg.MigrationsHistoryTable("__EFMigrationsHistory", TasksDbContext.Schema)));

        services.AddScoped<TaskService>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/tasks").WithTags("Tasks").RequireAuthorization();

        group.MapGet("/summary", async (int? responsibleId, TaskService svc) =>
            Results.Ok((await svc.GetSummaryAsync(responsibleId)).Data));

        group.MapGet("/", async (string? status, int? responsibleId, int? dealId, int? projectId, string? category, bool? overdue, DateTime? dueFrom, DateTime? dueTo, TaskService svc) =>
            Results.Ok((await svc.GetAllAsync(status, responsibleId, dealId, projectId, category, overdue, dueFrom, dueTo)).Data));

        group.MapGet("/{id:int}", async (int id, TaskService svc) =>
        {
            var r = await svc.GetByIdAsync(id);
            return r.IsSuccess ? Results.Ok(r.Data) : Results.NotFound(new { error = r.Error });
        });

        group.MapPost("/", async (CreateTaskRequest req, TaskService svc) =>
        {
            var r = await svc.CreateAsync(req);
            return r.IsSuccess ? Results.Created($"/api/tasks/{r.Data!.Id}", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/{id:int}", async (int id, UpdateTaskRequest req, TaskService svc) =>
        {
            var r = await svc.UpdateAsync(id, req);
            return r.IsSuccess ? Results.Ok(r.Data) : r.StatusCode == 404 ? Results.NotFound() : Results.BadRequest(new { error = r.Error });
        });

        group.MapDelete("/{id:int}", async (int id, TaskService svc) =>
        {
            var r = await svc.DeleteAsync(id);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });
    }

    public void UsePipeline(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TasksDbContext>();
        db.Database.Migrate();
    }
}
