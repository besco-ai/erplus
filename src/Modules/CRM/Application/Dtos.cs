namespace ERPlus.Modules.CRM.Application;

// ── Contact ──
public record ContactDto(
    int Id, string Type, string PersonType, string Name, string? Company,
    string? Cnpj, string? Cpf, string? Phone, string? Email,
    string? City, string? State, string Status, int? LinkedToId,
    string? LinkedToName, string? Position, string? Birthday,
    DateTime CreatedAt, int ObservationsCount, int LinkedContactsCount);

public record ContactDetailDto(
    int Id, string Type, string PersonType, string Name, string? Company,
    string? Cnpj, string? Cpf, string? Phone, string? Email,
    string? City, string? State, string Status, int? LinkedToId,
    string? LinkedToName, string? Position, string? Birthday,
    DateTime CreatedAt, DateTime? UpdatedAt,
    List<ContactObservationDto> Observations,
    List<ContactLinkedDto> LinkedContacts);

public record ContactLinkedDto(int Id, string Name, string PersonType, string? Position, string? Phone, string? Email);

public record CreateContactRequest(
    string Type, string PersonType, string Name, string? Company,
    string? Cnpj, string? Cpf, string? Phone, string? Email,
    string? City, string? State, string? Status, int? LinkedToId,
    string? Position, string? Birthday);

public record UpdateContactRequest(
    string? Type, string? PersonType, string? Name, string? Company,
    string? Cnpj, string? Cpf, string? Phone, string? Email,
    string? City, string? State, string? Status, int? LinkedToId,
    string? Position, string? Birthday);

// ── Observations ──
public record ContactObservationDto(int Id, int ContactId, string Title, string Content, DateTime Date);

public record CreateObservationRequest(string Title, string Content, DateTime? Date);

// ── Contact Types ──
public record ContactTypeDto(int Id, string Name, string? Description);
public record CreateContactTypeRequest(string Name, string? Description);
