using ERPlus.Modules.Identity.Domain.Entities;
using ERPlus.Modules.Identity.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Identity.Application.Services;

public class UserService
{
    private readonly IdentityDbContext _db;
    private static readonly HashSet<string> ValidRoles = new() { "Operador Master", "Colaborador", "Visitante" };

    public UserService(IdentityDbContext db) => _db = db;

    public async Task<Result<List<UserDto>>> GetAllAsync()
    {
        var users = await _db.Users
            .OrderBy(u => u.Name)
            .Select(u => new UserDto(u.Id, u.Name, u.Email, u.Role, u.Initials, u.IsActive, u.CreatedAt, u.LastLoginAt))
            .ToListAsync();

        return Result<List<UserDto>>.Success(users);
    }

    public async Task<Result<UserDetailDto>> GetByIdAsync(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return Result<UserDetailDto>.NotFound("Usuário não encontrado");

        var permissions = await _db.RolePermissions
            .Where(rp => rp.RoleName == user.Role)
            .ToDictionaryAsync(p => p.Resource, p => new PermissionDto(p.CanView, p.CanEdit, p.CanDelete));

        return Result<UserDetailDto>.Success(new UserDetailDto(
            user.Id, user.Name, user.Email, user.Role, user.Initials,
            user.IsActive, user.CreatedAt, user.LastLoginAt, permissions));
    }

    public async Task<Result<UserDto>> CreateAsync(CreateUserRequest request)
    {
        // Validações
        if (string.IsNullOrWhiteSpace(request.Name))
            return Result<UserDto>.Failure("Nome é obrigatório");

        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            return Result<UserDto>.Failure("E-mail inválido");

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return Result<UserDto>.Failure("Senha deve ter no mínimo 6 caracteres");

        if (!ValidRoles.Contains(request.Role))
            return Result<UserDto>.Failure($"Role inválido. Use: {string.Join(", ", ValidRoles)}");

        var emailNormalized = request.Email.Trim().ToLower();
        if (await _db.Users.AnyAsync(u => u.Email == emailNormalized))
            return Result<UserDto>.Failure("E-mail já cadastrado");

        var initials = BuildInitials(request.Name);

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = emailNormalized,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            Initials = initials
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Result<UserDto>.Created(ToDto(user));
    }

    public async Task<Result<UserDto>> UpdateAsync(int id, UpdateUserRequest request)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return Result<UserDto>.NotFound("Usuário não encontrado");

        if (request.Name is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return Result<UserDto>.Failure("Nome não pode ser vazio");
            user.Name = request.Name.Trim();
            user.Initials = BuildInitials(user.Name);
        }

        if (request.Email is not null)
        {
            var emailNormalized = request.Email.Trim().ToLower();
            if (!emailNormalized.Contains('@'))
                return Result<UserDto>.Failure("E-mail inválido");
            if (await _db.Users.AnyAsync(u => u.Email == emailNormalized && u.Id != id))
                return Result<UserDto>.Failure("E-mail já está em uso por outro usuário");
            user.Email = emailNormalized;
        }

        if (request.Role is not null)
        {
            if (!ValidRoles.Contains(request.Role))
                return Result<UserDto>.Failure($"Role inválido. Use: {string.Join(", ", ValidRoles)}");
            user.Role = request.Role;
        }

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<UserDto>.Success(ToDto(user));
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return Result<bool>.NotFound("Usuário não encontrado");

        // Prevent deleting the last Operador Master
        if (user.Role == "Operador Master")
        {
            var masterCount = await _db.Users.CountAsync(u => u.Role == "Operador Master" && u.Id != id);
            if (masterCount == 0)
                return Result<bool>.Failure("Não é possível excluir o último Operador Master");
        }

        user.IsDeleted = true;
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> ResetPasswordAsync(int id, string newPassword)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return Result<bool>.NotFound("Usuário não encontrado");

        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
            return Result<bool>.Failure("Senha deve ter no mínimo 6 caracteres");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<bool>.Success(true);
    }

    // ── Permissions ──

    public async Task<Result<Dictionary<string, Dictionary<string, PermissionDto>>>> GetAllPermissionsAsync()
    {
        var all = await _db.RolePermissions.ToListAsync();
        var grouped = all
            .GroupBy(p => p.RoleName)
            .ToDictionary(
                g => g.Key,
                g => g.ToDictionary(p => p.Resource, p => new PermissionDto(p.CanView, p.CanEdit, p.CanDelete)));

        return Result<Dictionary<string, Dictionary<string, PermissionDto>>>.Success(grouped);
    }

    public async Task<Result<bool>> UpdatePermissionsAsync(UpdatePermissionsRequest request)
    {
        if (!ValidRoles.Contains(request.RoleName))
            return Result<bool>.Failure("Role inválido");

        var existing = await _db.RolePermissions.Where(rp => rp.RoleName == request.RoleName).ToListAsync();

        foreach (var (resource, perm) in request.Permissions)
        {
            var current = existing.FirstOrDefault(e => e.Resource == resource);
            if (current is not null)
            {
                current.CanView = perm.CanView;
                current.CanEdit = perm.CanEdit;
                current.CanDelete = perm.CanDelete;
                current.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _db.RolePermissions.Add(new RolePermission
                {
                    RoleName = request.RoleName,
                    Resource = resource,
                    CanView = perm.CanView,
                    CanEdit = perm.CanEdit,
                    CanDelete = perm.CanDelete
                });
            }
        }

        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    // ── Helpers ──

    private static string BuildInitials(string name) =>
        string.Join("", name.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Take(2).Select(w => char.ToUpper(w[0])));

    private static UserDto ToDto(User u) =>
        new(u.Id, u.Name, u.Email, u.Role, u.Initials, u.IsActive, u.CreatedAt, u.LastLoginAt);
}
