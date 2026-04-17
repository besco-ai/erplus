using ERPlus.Modules.Commercial.Domain.Entities;
using ERPlus.Modules.Commercial.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Commercial.Application.Services;

public class QuoteService
{
    private readonly CommercialDbContext _db;
    private const int RevertWindowHours = 24;

    public QuoteService(CommercialDbContext db) => _db = db;

    public async Task<Result<List<QuoteDto>>> GetAllAsync(int? dealId)
    {
        var query = _db.Quotes.AsQueryable();
        if (dealId.HasValue) query = query.Where(q => q.DealId == dealId.Value);

        var quotes = await query.OrderByDescending(q => q.Data)
            .Select(q => new QuoteDto(q.Id, q.Numero, q.DealId, q.Titulo, q.ClientId,
                q.ItemsJson, q.Valor, q.Status, q.Data, q.Validade, q.Conditions, q.StatusChangedAt))
            .ToListAsync();

        return Result<List<QuoteDto>>.Success(quotes);
    }

    public async Task<Result<QuoteDto>> CreateAsync(CreateQuoteRequest r)
    {
        var deal = await _db.Deals.FindAsync(r.DealId);
        if (deal is null) return Result<QuoteDto>.Failure("Negócio não encontrado");

        var maxNum = await _db.Quotes.MaxAsync(q => (int?)q.Id) ?? 0;
        var numero = $"ORC-{(maxNum + 1):D3}";

        var quote = new Quote
        {
            Numero = numero,
            DealId = r.DealId,
            Titulo = r.Titulo.Trim(),
            ClientId = r.ClientId > 0 ? r.ClientId : deal.ClientId,
            ItemsJson = r.ItemsJson,
            Valor = r.Valor,
            Status = "Rascunho",
            Data = DateTime.UtcNow,
            Validade = r.Validade,
            Conditions = r.Conditions
        };

        _db.Quotes.Add(quote);
        _db.DealTimeline.Add(new DealTimelineEntry
        {
            DealId = r.DealId,
            Date = DateTime.UtcNow,
            Type = "quote",
            Text = $"Orçamento {numero} criado",
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        return Result<QuoteDto>.Created(new QuoteDto(
            quote.Id, quote.Numero, quote.DealId, quote.Titulo, quote.ClientId,
            quote.ItemsJson, quote.Valor, quote.Status, quote.Data,
            quote.Validade, quote.Conditions, null));
    }

    public async Task<Result<QuoteDto>> UpdateStatusAsync(int id, UpdateQuoteStatusRequest r)
    {
        var quote = await _db.Quotes.FindAsync(id);
        if (quote is null) return Result<QuoteDto>.NotFound();

        var validStatuses = new HashSet<string> { "Rascunho", "Enviado", "Aprovado", "Recusado" };
        if (!validStatuses.Contains(r.Status))
            return Result<QuoteDto>.Failure("Status inválido");

        var oldStatus = quote.Status;

        // Janela de reversão de 24h: uma vez Aprovado ou Recusado, o status só
        // pode ser alterado dentro das próximas 24h após o último StatusChangedAt.
        // Depois disso, o orçamento é considerado fechado e não é mais editável.
        var isTerminalStatus = oldStatus == "Aprovado" || oldStatus == "Recusado";
        if (isTerminalStatus && r.Status != oldStatus && quote.StatusChangedAt.HasValue)
        {
            var hoursSince = (DateTime.UtcNow - quote.StatusChangedAt.Value).TotalHours;
            if (hoursSince > RevertWindowHours)
            {
                return Result<QuoteDto>.Failure(
                    $"Orçamento {oldStatus.ToLower()} há mais de {RevertWindowHours}h não pode mais ser revertido.");
            }
        }

        quote.Status = r.Status;
        quote.StatusChangedAt = DateTime.UtcNow;
        quote.UpdatedAt = DateTime.UtcNow;

        // If approved → auto-create contract
        if (r.Status == "Aprovado" && oldStatus != "Aprovado")
        {
            var deal = await _db.Deals.FindAsync(quote.DealId);
            var maxCtr = await _db.Contracts.MaxAsync(c => (int?)c.Id) ?? 0;

            _db.Contracts.Add(new Contract
            {
                Numero = $"CTR-{(maxCtr + 1):D3}",
                QuoteId = quote.Id,
                DealId = quote.DealId,
                ClientId = quote.ClientId,
                Titulo = quote.Titulo,
                Valor = quote.Valor,
                Status = "Vigente",
                DataInicio = DateTime.UtcNow,
                ResponsibleId = deal?.ResponsibleId ?? 1,
                Registro = deal?.Registro,
                InscricaoImob = deal?.InscricaoImob,
                EndEmpreendimento = deal?.EndEmpreendimento,
                BusinessTypeId = deal?.BusinessTypeId
            });

            _db.DealTimeline.Add(new DealTimelineEntry
            {
                DealId = quote.DealId, Date = DateTime.UtcNow, Type = "contract",
                Text = $"Contrato criado a partir de {quote.Numero} aprovado",
                CreatedAt = DateTime.UtcNow
            });
        }

        // If reverting from approved, remove associated contract
        if (oldStatus == "Aprovado" && r.Status != "Aprovado")
        {
            var contract = await _db.Contracts.FirstOrDefaultAsync(c => c.QuoteId == id);
            if (contract is not null) _db.Contracts.Remove(contract);
        }

        _db.DealTimeline.Add(new DealTimelineEntry
        {
            DealId = quote.DealId, Date = DateTime.UtcNow, Type = "quote",
            Text = $"{quote.Numero} passou de \"{oldStatus}\" para \"{r.Status}\"",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return Result<QuoteDto>.Success(new QuoteDto(
            quote.Id, quote.Numero, quote.DealId, quote.Titulo, quote.ClientId,
            quote.ItemsJson, quote.Valor, quote.Status, quote.Data,
            quote.Validade, quote.Conditions, quote.StatusChangedAt));
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var quote = await _db.Quotes.FindAsync(id);
        if (quote is null) return Result<bool>.NotFound();
        _db.Quotes.Remove(quote);
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}
