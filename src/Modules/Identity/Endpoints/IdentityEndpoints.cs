using System.Security.Claims;
using ERPlus.Modules.Identity.Application;
using ERPlus.Modules.Identity.Application.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace ERPlus.Modules.Identity.Endpoints;

public static class IdentityEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/identity").WithTags("Identity");

        MapAuthEndpoints(group);
        MapUserEndpoints(group);
        MapPermissionEndpoints(group);
    }

    private static void MapAuthEndpoints(RouteGroupBuilder group)
    {
        group.MapPost("/login", async (LoginRequest request, AuthService auth) =>
        {
            var result = await auth.LoginAsync(request);
            return result.IsSuccess
                ? Results.Ok(result.Data)
                : Results.Json(new { error = result.Error }, statusCode: result.StatusCode);
        }).AllowAnonymous();

        group.MapPost("/refresh", async (RefreshTokenRequest request, AuthService auth) =>
        {
            var result = await auth.RefreshAsync(request);
            return result.IsSuccess
                ? Results.Ok(result.Data)
                : Results.Json(new { error = result.Error }, statusCode: result.StatusCode);
        }).AllowAnonymous();

        group.MapPost("/logout", async (HttpContext ctx, AuthService auth) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();

            // Try to get refresh token from body
            var body = await ctx.Request.ReadFromJsonAsync<RefreshTokenRequest>();
            var result = await auth.LogoutAsync(userId, body?.RefreshToken);
            return Results.Ok(new { message = "Logout realizado" });
        }).RequireAuthorization();

        group.MapPost("/change-password", async (ChangePasswordRequest request, HttpContext ctx, AuthService auth) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();

            var result = await auth.ChangePasswordAsync(userId, request);
            return result.IsSuccess
                ? Results.Ok(new { message = "Senha alterada com sucesso" })
                : Results.BadRequest(new { error = result.Error });
        }).RequireAuthorization();

        group.MapGet("/me", async (HttpContext ctx, UserService svc) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();

            var result = await svc.GetByIdAsync(userId);
            return result.IsSuccess ? Results.Ok(result.Data) : Results.NotFound(new { error = result.Error });
        }).RequireAuthorization();
    }

    private static void MapUserEndpoints(RouteGroupBuilder group)
    {
        var users = group.MapGroup("/users").RequireAuthorization();

        users.MapGet("/", async (UserService svc) =>
        {
            var result = await svc.GetAllAsync();
            return Results.Ok(result.Data);
        });

        users.MapGet("/{id:int}", async (int id, UserService svc) =>
        {
            var result = await svc.GetByIdAsync(id);
            return result.IsSuccess ? Results.Ok(result.Data) : Results.NotFound(new { error = result.Error });
        });

        users.MapPost("/", async (CreateUserRequest request, UserService svc) =>
        {
            var result = await svc.CreateAsync(request);
            return result.IsSuccess
                ? Results.Created($"/api/identity/users/{result.Data!.Id}", result.Data)
                : Results.BadRequest(new { error = result.Error });
        });

        users.MapPut("/{id:int}", async (int id, UpdateUserRequest request, UserService svc) =>
        {
            var result = await svc.UpdateAsync(id, request);
            return result.IsSuccess
                ? Results.Ok(result.Data)
                : result.StatusCode == 404
                    ? Results.NotFound(new { error = result.Error })
                    : Results.BadRequest(new { error = result.Error });
        });

        users.MapDelete("/{id:int}", async (int id, UserService svc) =>
        {
            var result = await svc.DeleteAsync(id);
            return result.IsSuccess
                ? Results.NoContent()
                : result.StatusCode == 404
                    ? Results.NotFound(new { error = result.Error })
                    : Results.BadRequest(new { error = result.Error });
        });

        users.MapPost("/{id:int}/reset-password", async (int id, ResetPasswordBody body, UserService svc) =>
        {
            var result = await svc.ResetPasswordAsync(id, body.NewPassword);
            return result.IsSuccess
                ? Results.Ok(new { message = "Senha redefinida" })
                : Results.BadRequest(new { error = result.Error });
        });
    }

    private static void MapPermissionEndpoints(RouteGroupBuilder group)
    {
        var perms = group.MapGroup("/permissions").RequireAuthorization();

        perms.MapGet("/", async (UserService svc) =>
        {
            var result = await svc.GetAllPermissionsAsync();
            return Results.Ok(result.Data);
        });

        perms.MapPut("/", async (UpdatePermissionsRequest request, UserService svc) =>
        {
            var result = await svc.UpdatePermissionsAsync(request);
            return result.IsSuccess
                ? Results.Ok(new { message = "Permissões atualizadas" })
                : Results.BadRequest(new { error = result.Error });
        });
    }

    private static int GetUserId(HttpContext ctx)
    {
        var claim = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : 0;
    }
}

// Small body record for reset-password endpoint
public record ResetPasswordBody(string NewPassword);
