using System.Security.Claims;
using ERPlus.Shared.Contracts;
using Microsoft.AspNetCore.Http;

namespace ERPlus.Modules.Identity.Infrastructure;

public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUser(IHttpContextAccessor httpContextAccessor)
        => _httpContextAccessor = httpContextAccessor;

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public int Id => int.TryParse(User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
    public string Name => User?.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
    public string Email => User?.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    public string Role => User?.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
}
