using ERPlus.Modules.Config.Domain.Entities;
using ERPlus.Modules.Config.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Config.Application;

public record ServiceItemDto(int Id, string Name, string? Category, string? Unit, decimal Price, string? Description, string Status);
public record CreateServiceItemRequest(string Name, string? Category, string? Unit, decimal Price, string? Description);
public record UpdateServiceItemRequest(string? Name, string? Category, string? Unit, decimal? Price, string? Description, string? Status);
public record CompanySettingDto(int Id, string Key, string Value);
public record SetSettingRequest(string Key, string Value);

public class ConfigService
{
    private readonly ConfigDbContext _db;
    public ConfigService(ConfigDbContext db) => _db = db;

    // Services
    public async Task<Result<List<ServiceItemDto>>> GetServicesAsync() =>
        Result<List<ServiceItemDto>>.Success(await _db.Services.OrderBy(s => s.Name)
            .Select(s => new ServiceItemDto(s.Id, s.Name, s.Category, s.Unit, s.Price, s.Description, s.Status)).ToListAsync());

    public async Task<Result<ServiceItemDto>> CreateServiceAsync(CreateServiceItemRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Name)) return Result<ServiceItemDto>.Failure("Nome é obrigatório");
        var s = new ServiceItem { Name = r.Name.Trim(), Category = r.Category, Unit = r.Unit, Price = r.Price, Description = r.Description };
        _db.Services.Add(s);
        await _db.SaveChangesAsync();
        return Result<ServiceItemDto>.Created(new ServiceItemDto(s.Id, s.Name, s.Category, s.Unit, s.Price, s.Description, s.Status));
    }

    public async Task<Result<ServiceItemDto>> UpdateServiceAsync(int id, UpdateServiceItemRequest r)
    {
        var s = await _db.Services.FindAsync(id);
        if (s is null) return Result<ServiceItemDto>.NotFound();
        if (r.Name is not null) s.Name = r.Name.Trim();
        if (r.Category is not null) s.Category = r.Category;
        if (r.Unit is not null) s.Unit = r.Unit;
        if (r.Price.HasValue) s.Price = r.Price.Value;
        if (r.Description is not null) s.Description = r.Description;
        if (r.Status is not null) s.Status = r.Status;
        s.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<ServiceItemDto>.Success(new ServiceItemDto(s.Id, s.Name, s.Category, s.Unit, s.Price, s.Description, s.Status));
    }

    public async Task<Result<bool>> DeleteServiceAsync(int id)
    {
        var s = await _db.Services.FindAsync(id);
        if (s is null) return Result<bool>.NotFound();
        _db.Services.Remove(s);
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    // Settings
    public async Task<Result<List<CompanySettingDto>>> GetSettingsAsync() =>
        Result<List<CompanySettingDto>>.Success(await _db.Settings.OrderBy(s => s.Key)
            .Select(s => new CompanySettingDto(s.Id, s.Key, s.Value)).ToListAsync());

    public async Task<Result<CompanySettingDto>> SetSettingAsync(SetSettingRequest r)
    {
        var existing = await _db.Settings.FirstOrDefaultAsync(s => s.Key == r.Key);
        if (existing is not null) { existing.Value = r.Value; existing.UpdatedAt = DateTime.UtcNow; }
        else { existing = new CompanySettings { Key = r.Key, Value = r.Value }; _db.Settings.Add(existing); }
        await _db.SaveChangesAsync();
        return Result<CompanySettingDto>.Success(new CompanySettingDto(existing.Id, existing.Key, existing.Value));
    }
}
