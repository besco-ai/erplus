using ERPlus.Modules.Schedule.Application;
using ERPlus.Modules.Schedule.Application.Services;
using ERPlus.Modules.Schedule.Domain.Entities;
using ERPlus.Modules.Schedule.Infrastructure.Data;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPlus.Modules.Schedule;

public class ScheduleModuleInstaller : IModuleInstaller
{
    public string ModuleName => "Schedule";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ScheduleDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npg => npg.MigrationsHistoryTable("__EFMigrationsHistory", ScheduleDbContext.Schema)));

        services.AddScoped<EventService>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/schedule").WithTags("Schedule").RequireAuthorization();

        group.MapGet("/events", async (DateTime? from, DateTime? to, string? type, int? responsibleId, EventService svc) =>
            Results.Ok((await svc.GetAllAsync(from, to, type, responsibleId)).Data));

        group.MapPost("/events", async (CreateEventRequest req, EventService svc) =>
        {
            var r = await svc.CreateAsync(req);
            return r.IsSuccess ? Results.Created($"/api/schedule/events/{r.Data!.Id}", r.Data) : Results.BadRequest(new { error = r.Error });
        });

        group.MapPut("/events/{id:int}", async (int id, UpdateEventRequest req, EventService svc) =>
        {
            var r = await svc.UpdateAsync(id, req);
            return r.IsSuccess ? Results.Ok(r.Data) : r.StatusCode == 404 ? Results.NotFound() : Results.BadRequest(new { error = r.Error });
        });

        group.MapDelete("/events/{id:int}", async (int id, EventService svc) =>
        {
            var r = await svc.DeleteAsync(id);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });

        // Lista todas as séries recorrentes ativas
        group.MapGet("/events/series", async (EventService svc) =>
            Results.Ok((await svc.GetSeriesAsync()).Data));

        // Exclui toda a série recorrente
        group.MapDelete("/events/series/{recurrenceId}", async (string recurrenceId, EventService svc) =>
        {
            var r = await svc.DeleteSeriesAsync(recurrenceId);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });
    }

    public void UsePipeline(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ScheduleDbContext>();
        db.Database.Migrate();
    }
}
