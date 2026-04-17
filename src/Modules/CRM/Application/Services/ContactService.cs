using ERPlus.Modules.CRM.Domain.Entities;
using ERPlus.Modules.CRM.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.CRM.Application.Services;

public class ContactService
{
    private readonly CrmDbContext _db;
    private static readonly HashSet<string> ValidTypes = new() { "Lead", "Cliente", "Fornecedor", "Relacionamento" };
    private static readonly HashSet<string> ValidPersonTypes = new() { "PF", "PJ" };

    public ContactService(CrmDbContext db) => _db = db;

    public async Task<Result<PagedResult<ContactDto>>> GetAllAsync(
        string? search, string? type, string? personType, string? status,
        string? city, string? state, int page = 1, int pageSize = 50)
    {
        var query = _db.Contacts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(s) ||
                (c.Company != null && c.Company.ToLower().Contains(s)) ||
                (c.Email != null && c.Email.ToLower().Contains(s)) ||
                (c.Phone != null && c.Phone.Contains(s)) ||
                (c.Cnpj != null && c.Cnpj.Contains(s)) ||
                (c.Cpf != null && c.Cpf.Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(type)) query = query.Where(c => c.Type == type);
        if (!string.IsNullOrWhiteSpace(personType)) query = query.Where(c => c.PersonType == personType);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(c => c.Status == status);
        if (!string.IsNullOrWhiteSpace(city)) query = query.Where(c => c.City == city);
        if (!string.IsNullOrWhiteSpace(state)) query = query.Where(c => c.State == state);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ContactDto(
                c.Id, c.Type, c.PersonType, c.Name, c.Company,
                c.Cnpj, c.Cpf, c.Phone, c.Email, c.City, c.State,
                c.Status, c.LinkedToId,
                c.LinkedTo != null ? c.LinkedTo.Name : null,
                c.Position, c.Birthday, c.CreatedAt,
                c.Observations.Count, c.LinkedContacts.Count))
            .ToListAsync();

        return Result<PagedResult<ContactDto>>.Success(
            new PagedResult<ContactDto>(items, totalCount, page, pageSize));
    }

    public async Task<Result<ContactDetailDto>> GetByIdAsync(int id)
    {
        var contact = await _db.Contacts
            .Include(c => c.Observations.OrderByDescending(o => o.Date))
            .Include(c => c.LinkedContacts)
            .Include(c => c.LinkedTo)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (contact is null) return Result<ContactDetailDto>.NotFound();

        return Result<ContactDetailDto>.Success(new ContactDetailDto(
            contact.Id, contact.Type, contact.PersonType, contact.Name,
            contact.Company, contact.Cnpj, contact.Cpf, contact.Phone,
            contact.Email, contact.City, contact.State, contact.Status,
            contact.LinkedToId, contact.LinkedTo?.Name, contact.Position,
            contact.Birthday, contact.CreatedAt, contact.UpdatedAt,
            contact.Observations.Select(o => new ContactObservationDto(
                o.Id, o.ContactId, o.Title, o.Content, o.Date)).ToList(),
            contact.LinkedContacts.Select(lc => new ContactLinkedDto(
                lc.Id, lc.Name, lc.PersonType, lc.Position, lc.Phone, lc.Email)).ToList()));
    }

    public async Task<Result<ContactDto>> CreateAsync(CreateContactRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Result<ContactDto>.Failure("Nome é obrigatório");

        if (!ValidTypes.Contains(request.Type))
            return Result<ContactDto>.Failure($"Tipo inválido. Use: {string.Join(", ", ValidTypes)}");

        if (!ValidPersonTypes.Contains(request.PersonType))
            return Result<ContactDto>.Failure("Tipo de pessoa deve ser PF ou PJ");

        var contact = new Contact
        {
            Type = request.Type,
            PersonType = request.PersonType,
            Name = request.Name.Trim(),
            Company = request.Company?.Trim(),
            Cnpj = request.Cnpj?.Trim(),
            Cpf = request.Cpf?.Trim(),
            Phone = request.Phone?.Trim(),
            Email = request.Email?.Trim().ToLower(),
            City = request.City?.Trim(),
            State = request.State?.Trim().ToUpper(),
            Status = request.Status ?? "Ativo",
            LinkedToId = request.LinkedToId,
            Position = request.Position?.Trim(),
            Birthday = request.Birthday
        };

        _db.Contacts.Add(contact);
        await _db.SaveChangesAsync();

        return Result<ContactDto>.Created(new ContactDto(
            contact.Id, contact.Type, contact.PersonType, contact.Name,
            contact.Company, contact.Cnpj, contact.Cpf, contact.Phone,
            contact.Email, contact.City, contact.State, contact.Status,
            contact.LinkedToId, null, contact.Position, contact.Birthday,
            contact.CreatedAt, 0, 0));
    }

    public async Task<Result<ContactDto>> UpdateAsync(int id, UpdateContactRequest request)
    {
        var contact = await _db.Contacts.FindAsync(id);
        if (contact is null) return Result<ContactDto>.NotFound();

        if (request.Type is not null && !ValidTypes.Contains(request.Type))
            return Result<ContactDto>.Failure($"Tipo inválido. Use: {string.Join(", ", ValidTypes)}");

        if (request.Type is not null) contact.Type = request.Type;
        if (request.PersonType is not null) contact.PersonType = request.PersonType;
        if (request.Name is not null) contact.Name = request.Name.Trim();
        if (request.Company is not null) contact.Company = request.Company.Trim();
        if (request.Cnpj is not null) contact.Cnpj = request.Cnpj.Trim();
        if (request.Cpf is not null) contact.Cpf = request.Cpf.Trim();
        if (request.Phone is not null) contact.Phone = request.Phone.Trim();
        if (request.Email is not null) contact.Email = request.Email.Trim().ToLower();
        if (request.City is not null) contact.City = request.City.Trim();
        if (request.State is not null) contact.State = request.State.Trim().ToUpper();
        if (request.Status is not null) contact.Status = request.Status;
        if (request.LinkedToId is not null) contact.LinkedToId = request.LinkedToId;
        if (request.Position is not null) contact.Position = request.Position.Trim();
        if (request.Birthday is not null) contact.Birthday = request.Birthday;

        contact.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var linkedName = contact.LinkedToId.HasValue
            ? (await _db.Contacts.FindAsync(contact.LinkedToId.Value))?.Name : null;

        return Result<ContactDto>.Success(new ContactDto(
            contact.Id, contact.Type, contact.PersonType, contact.Name,
            contact.Company, contact.Cnpj, contact.Cpf, contact.Phone,
            contact.Email, contact.City, contact.State, contact.Status,
            contact.LinkedToId, linkedName, contact.Position, contact.Birthday,
            contact.CreatedAt, 0, 0));
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var contact = await _db.Contacts.FindAsync(id);
        if (contact is null) return Result<bool>.NotFound();

        contact.IsDeleted = true;
        contact.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<bool>.Success(true);
    }

    // ── Observations ──

    public async Task<Result<ContactObservationDto>> AddObservationAsync(int contactId, CreateObservationRequest request)
    {
        var contact = await _db.Contacts.FindAsync(contactId);
        if (contact is null) return Result<ContactObservationDto>.NotFound("Contato não encontrado");

        if (string.IsNullOrWhiteSpace(request.Title))
            return Result<ContactObservationDto>.Failure("Título é obrigatório");

        var obs = new ContactObservation
        {
            ContactId = contactId,
            Title = request.Title.Trim(),
            Content = request.Content?.Trim() ?? "",
            Date = request.Date ?? DateTime.UtcNow
        };

        _db.ContactObservations.Add(obs);
        await _db.SaveChangesAsync();

        return Result<ContactObservationDto>.Created(
            new ContactObservationDto(obs.Id, obs.ContactId, obs.Title, obs.Content, obs.Date));
    }

    public async Task<Result<bool>> DeleteObservationAsync(int contactId, int obsId)
    {
        var obs = await _db.ContactObservations.FirstOrDefaultAsync(o => o.Id == obsId && o.ContactId == contactId);
        if (obs is null) return Result<bool>.NotFound();

        _db.ContactObservations.Remove(obs);
        await _db.SaveChangesAsync();

        return Result<bool>.Success(true);
    }

    // ── Contact Types ──

    public async Task<Result<List<ContactTypeDto>>> GetTypesAsync()
    {
        var types = await _db.ContactTypes.OrderBy(t => t.Name)
            .Select(t => new ContactTypeDto(t.Id, t.Name, t.Description))
            .ToListAsync();
        return Result<List<ContactTypeDto>>.Success(types);
    }

    public async Task<Result<ContactTypeDto>> CreateTypeAsync(CreateContactTypeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Result<ContactTypeDto>.Failure("Nome é obrigatório");

        var type = new ContactType { Name = request.Name.Trim(), Description = request.Description?.Trim() };
        _db.ContactTypes.Add(type);
        await _db.SaveChangesAsync();

        return Result<ContactTypeDto>.Created(new ContactTypeDto(type.Id, type.Name, type.Description));
    }
}
