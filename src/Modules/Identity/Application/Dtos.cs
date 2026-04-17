namespace ERPlus.Modules.Identity.Application;

// ── Auth ──
public record LoginRequest(string Email, string Password);

public record LoginResponse(
    string Token,
    string RefreshToken,
    int UserId,
    string Name,
    string Email,
    string Role,
    string Initials,
    Dictionary<string, PermissionDto> Permissions,
    int ExpiresInMinutes);

public record RefreshTokenRequest(string RefreshToken);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

// ── Users ──
public record UserDto(
    int Id, string Name, string Email, string Role, string Initials,
    bool IsActive, DateTime CreatedAt, DateTime? LastLoginAt);

public record UserDetailDto(
    int Id, string Name, string Email, string Role, string Initials,
    bool IsActive, DateTime CreatedAt, DateTime? LastLoginAt,
    Dictionary<string, PermissionDto> Permissions);

public record CreateUserRequest(string Name, string Email, string Password, string Role);

public record UpdateUserRequest(string? Name, string? Email, string? Role, bool? IsActive);

// ── Permissions ──
public record PermissionDto(bool CanView, bool CanEdit, bool CanDelete);

public record UpdatePermissionsRequest(string RoleName, Dictionary<string, PermissionDto> Permissions);
