using ERPlus.Modules.Notifications.Application;
using ERPlus.Modules.Notifications.Application.Services;
using ERPlus.Modules.Notifications.Infrastructure.Data;
using ERPlus.Shared.Application;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPlus.Modules.Notifications;

public class NotificationsModuleInstaller : IModuleInstaller
{
    public string ModuleName => "Notifications";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<NotificationsDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npg => npg.MigrationsHistoryTable("__EFMigrationsHistory", NotificationsDbContext.Schema)));

        services.AddScoped<NotificationService>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/notifications").WithTags("Notifications").RequireAuthorization();

        // GET /api/notifications?onlyUnread=true
        group.MapGet("/", async (bool? onlyUnread, HttpContext ctx, NotificationService svc) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();
            var r = await svc.GetByUserAsync(userId, onlyUnread);
            return Results.Ok(r.Data);
        });

        // GET /api/notifications/unread-count
        group.MapGet("/unread-count", async (HttpContext ctx, NotificationService svc) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();
            var r = await svc.GetUnreadCountAsync(userId);
            return Results.Ok(r.Data);
        });

        // POST /api/notifications (interno — criar notificação)
        group.MapPost("/", async (CreateNotificationRequest req, NotificationService svc) =>
        {
            var r = await svc.CreateAsync(req);
            return r.IsSuccess
                ? Results.Created($"/api/notifications/{r.Data!.Id}", r.Data)
                : Results.BadRequest(new { error = r.Error });
        });

        // PUT /api/notifications/{id}/read
        group.MapPut("/{id:int}/read", async (int id, HttpContext ctx, NotificationService svc) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();
            var r = await svc.MarkAsReadAsync(id, userId);
            return r.IsSuccess ? Results.Ok(r.Data) : Results.NotFound();
        });

        // PUT /api/notifications/read-all
        group.MapPut("/read-all", async (HttpContext ctx, NotificationService svc) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();
            await svc.MarkAllAsReadAsync(userId);
            return Results.NoContent();
        });

        // DELETE /api/notifications/{id}
        group.MapDelete("/{id:int}", async (int id, HttpContext ctx, NotificationService svc) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();
            var r = await svc.DeleteAsync(id, userId);
            return r.IsSuccess ? Results.NoContent() : Results.NotFound();
        });
    }

    public void UsePipeline(IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NotificationsDbContext>();
        db.Database.Migrate();
    }

    private static int GetUserId(HttpContext ctx)
    {
        var sub = ctx.User.FindFirst("sub")?.Value
               ?? ctx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : 0;
    }
}
