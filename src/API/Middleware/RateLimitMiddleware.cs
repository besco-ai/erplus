using System.Collections.Concurrent;
using System.Net;

namespace ERPlus.API.Middleware;

public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly ConcurrentDictionary<string, (int Count, DateTime WindowStart)> _clients = new();
    private const int MaxRequests = 10;
    private const int WindowSeconds = 60;

    public RateLimitMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        // Only rate-limit auth endpoints
        var path = context.Request.Path.Value?.ToLower() ?? "";
        if (!path.Contains("/identity/login") && !path.Contains("/identity/refresh"))
        {
            await _next(context);
            return;
        }

        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var now = DateTime.UtcNow;

        var entry = _clients.GetOrAdd(clientIp, _ => (0, now));

        // Reset window if expired
        if ((now - entry.WindowStart).TotalSeconds > WindowSeconds)
        {
            entry = (0, now);
        }

        entry.Count++;
        _clients[clientIp] = entry;

        if (entry.Count > MaxRequests)
        {
            context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
            context.Response.Headers["Retry-After"] = WindowSeconds.ToString();
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Muitas tentativas. Aguarde antes de tentar novamente.",
                retryAfterSeconds = WindowSeconds
            });
            return;
        }

        await _next(context);
    }
}

public static class RateLimitMiddlewareExtensions
{
    public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder app)
        => app.UseMiddleware<RateLimitMiddleware>();
}
