using ERPlus.Shared.Domain;

namespace ERPlus.Modules.CRM.Domain.Entities;

public class Contact : BaseEntity
{
    public string Type { get; set; } = "Lead"; // Lead, Cliente, Fornecedor, Relacionamento
    public string PersonType { get; set; } = "PJ"; // PF ou PJ
    public string Name { get; set; } = string.Empty;
    public string? Company { get; set; }
    public string? Cnpj { get; set; }
    public string? Cpf { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string Status { get; set; } = "Ativo";
    public int? LinkedToId { get; set; } // vinculadoA - PF vinculada a PJ
    public string? Position { get; set; } // cargo
    public string? Birthday { get; set; }

    // Navigation
    public Contact? LinkedTo { get; set; }
    public ICollection<Contact> LinkedContacts { get; set; } = new List<Contact>();
    public ICollection<ContactObservation> Observations { get; set; } = new List<ContactObservation>();
}

public class ContactObservation : BaseEntity
{
    public int ContactId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime Date { get; set; }

    public Contact Contact { get; set; } = null!;
}

public class ContactType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
