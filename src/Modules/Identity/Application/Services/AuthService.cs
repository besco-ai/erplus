using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ERPlus.Modules.Identity.Domain.Entities;
using ERPlus.Modules.Identity.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ERPlus.Modules.Identity.Application.Services;

public class AuthService
{
    private readonly IdentityDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(IdentityDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<Result<LoginResponse>> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.Trim().ToLower());

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Result<LoginResponse>.Failure("E-mail ou senha inválidos", 401);

        if (!user.IsActive)
            return Result<LoginResponse>.Failure("Usuário desativado", 403);

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<LoginResponse>.Success(await BuildLoginResponse(user));
    }

    public async Task<Result<LoginResponse>> RefreshAsync(RefreshTokenRequest request)
    {
        var stored = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

        if (stored is null || !stored.IsActive)
            return Result<LoginResponse>.Failure("Refresh token inválido ou expirado", 401);

        // Revoke old and create new
        stored.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<LoginResponse>.Success(await BuildLoginResponse(stored.User));
    }

    public async Task<Result<bool>> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user is null) return Result<bool>.NotFound("Usuário não encontrado");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return Result<bool>.Failure("Senha atual incorreta");

        if (request.NewPassword.Length < 6)
            return Result<bool>.Failure("Nova senha deve ter no mínimo 6 caracteres");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        // Revoke all refresh tokens
        var tokens = await _db.RefreshTokens.Where(rt => rt.UserId == userId && rt.RevokedAt == null).ToListAsync();
        foreach (var t in tokens) t.RevokedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> LogoutAsync(int userId, string? refreshToken)
    {
        if (!string.IsNullOrEmpty(refreshToken))
        {
            var stored = await _db.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken && rt.UserId == userId);
            if (stored is not null) stored.RevokedAt = DateTime.UtcNow;
        }
        else
        {
            // Revoke all tokens for user
            var tokens = await _db.RefreshTokens.Where(rt => rt.UserId == userId && rt.RevokedAt == null).ToListAsync();
            foreach (var t in tokens) t.RevokedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    // ── Helpers ──

    private async Task<LoginResponse> BuildLoginResponse(User user)
    {
        var expiresInMinutes = _config.GetValue("Jwt:ExpiresInMinutes", 480);
        var accessToken = GenerateAccessToken(user, expiresInMinutes);
        var refreshToken = await GenerateRefreshToken(user.Id);
        var permissions = await GetPermissionsForRole(user.Role);

        return new LoginResponse(
            accessToken, refreshToken, user.Id, user.Name, user.Email,
            user.Role, user.Initials, permissions, expiresInMinutes);
    }

    private string GenerateAccessToken(User user, int expiresInMinutes)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "ERPlus-Dev-SecretKey-MinimoTrintaDoisChars!"));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("initials", user.Initials)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "ERPlus",
            audience: _config["Jwt:Audience"] ?? "ERPlus",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string> GenerateRefreshToken(int userId)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var refreshToken = new RefreshToken
        {
            UserId = userId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();
        return token;
    }

    private async Task<Dictionary<string, PermissionDto>> GetPermissionsForRole(string roleName)
    {
        var perms = await _db.RolePermissions
            .Where(rp => rp.RoleName == roleName)
            .ToListAsync();

        return perms.ToDictionary(
            p => p.Resource,
            p => new PermissionDto(p.CanView, p.CanEdit, p.CanDelete));
    }
}
