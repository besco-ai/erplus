import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Save, Search, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_LIST = ['Rascunho', 'Enviado', 'Aprovado', 'Recusado'];

const statusStyle = {
  Rascunho: { badge: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  Enviado:  { badge: 'bg-blue-50 text-blue-600',    dot: 'bg-blue-500' },
  Aprovado: { badge: 'bg-green-50 text-green-600',  dot: 'bg-green-500' },
  Recusado: { badge: 'bg-red-50 text-red-500',      dot: 'bg-red-400' },
};

// ── Inline status dropdown ─────────────────────────────────────────────────────
function StatusDropdown({ quoteId, current, onChange }) {
  const [open, setOpen] = useState(false);
  const cfg = statusStyle[current] || statusStyle.Rascunho;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition ${cfg.badge} border-current/20 hover:opacity-80`}
      >
        {current}
        <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[130px]">
            {STATUS_LIST.map((s) => {
              const sc = statusStyle[s];
              return (
                <button
                  key={s}
                  onClick={() => { setOpen(false); if (s !== current) onChange(quoteId, s); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 transition ${s === current ? 'font-bold' : ''}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                  {s}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Summary card ───────────────────────────────────────────────────────────────
function SummaryCard({ label, count, value, active, onClick }) {
  const cfg = statusStyle[label] || statusStyle.Rascunho;
  return (
    <button
      onClick={onClick}
      className={`flex-1 bg-white rounded-2xl p-5 text-left border transition hover:shadow-md ${
        active ? 'border-erplus-accent shadow-sm' : 'border-gray-100'
      }`}
    >
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-3 ${cfg.badge}`}>
        {label}
      </span>
      <div className="text-3xl font-extrabold text-gray-900 mb-1">{count}</div>
      <div className="text-sm font-semibold text-erplus-accent">{R$(value)}</div>
    </button>
  );
}

const FORMAS_PAGAMENTO = ['Boleto', 'PIX', 'Transferência Bancária', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Cheque'];

// ── Quote form modal ───────────────────────────────────────────────────────────
function QuoteModal({ onClose, onSaved }) {
  const [deals, setDeals]       = useState([]);
  const [contacts, setContacts] = useState([]);
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    clientId: '',
    titulo: '',
    valor: '0',
    validade: '',
    dealId: '',
    formaPagamento: 'Boleto',
    numeroParcelas: '1',
    dataPrimeiroPagamento: today,
    observacoes: '',
  });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  useEffect(() => {
    Promise.allSettled([
      api.get('/commercial/deals'),
      api.get('/contacts'),
    ]).then(([dRes, cRes]) => {
      if (dRes.status === 'fulfilled') setDeals(dRes.value.data);
      if (cRes.status === 'fulfilled') setContacts(cRes.value.data);
    });
  }, []);

  const handleSave = async () => {
    if (!form.titulo.trim()) { setError('Título é obrigatório'); return; }
    if (!form.clientId)      { setError('Cliente é obrigatório'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/commercial/quotes', {
        clientId:               Number(form.clientId),
        titulo:                 form.titulo.trim(),
        valor:                  Number(form.valor) || 0,
        validade:               form.validade || null,
        dealId:                 form.dealId ? Number(form.dealId) : null,
        formaPagamento:         form.formaPagamento,
        numeroParcelas:         Number(form.numeroParcelas) || 1,
        dataPrimeiroPagamento:  form.dataPrimeiroPagamento || null,
        observacoes:            form.observacoes || null,
      });
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Novo Orçamento</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cliente</label>
            <Select
              value={form.clientId}
              onChange={(v) => setForm((p) => ({ ...p, clientId: v }))}
              options={contacts.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="— Selecionar —"
              className="w-full"
            />
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Título *</label>
            <input
              value={form.titulo}
              onChange={set('titulo')}
              placeholder="Ex: Viabilidade – Veneto"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20 focus:border-erplus-accent"
            />
          </div>

          {/* Valor + Validade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Valor (R$)</label>
              <input
                type="number" step="0.01" min="0"
                value={form.valor}
                onChange={set('valor')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20 focus:border-erplus-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Validade</label>
              <DatePicker
                value={form.validade}
                onChange={(v) => setForm((p) => ({ ...p, validade: v }))}
                className="w-full"
              />
            </div>
          </div>

          {/* Vincular a negócio */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Vincular a Negócio (opcional)</label>
            <Select
              value={form.dealId}
              onChange={(v) => setForm((p) => ({ ...p, dealId: v }))}
              options={[
                { value: '', label: '— Nenhum —' },
                ...deals.map((d) => ({ value: d.id, label: d.title || `Negócio #${d.id}` })),
              ]}
              placeholder="— Nenhum —"
              className="w-full"
            />
          </div>

          {/* Forma de pagamento + Parcelas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Forma de Pagamento</label>
              <Select
                value={form.formaPagamento}
                onChange={(v) => setForm((p) => ({ ...p, formaPagamento: v }))}
                options={FORMAS_PAGAMENTO.map((f) => ({ value: f, label: f }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Número de Parcelas</label>
              <input
                type="number" min="1"
                value={form.numeroParcelas}
                onChange={set('numeroParcelas')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20 focus:border-erplus-accent"
              />
            </div>
          </div>

          {/* Data 1º pagamento */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Data do 1º Pagamento</label>
            <DatePicker
              value={form.dataPrimeiroPagamento}
              onChange={(v) => setForm((p) => ({ ...p, dataPrimeiroPagamento: v }))}
              className="w-full"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={set('observacoes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20 focus:border-erplus-accent resize-none"
            />
          </div>
        </div>

        {error && <div className="mx-6 mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="flex justify-end gap-2 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 hover:bg-red-700 transition">
            <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function QuotesPage() {
  const [quotes, setQuotes]     = useState([]);
  const [deals, setDeals]       = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [modal, setModal]       = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, dRes, cRes] = await Promise.allSettled([
        api.get('/commercial/quotes'),
        api.get('/commercial/deals'),
        api.get('/contacts'),
      ]);
      if (qRes.status === 'fulfilled') setQuotes(qRes.value.data);
      if (dRes.status === 'fulfilled') setDeals(dRes.value.data);
      if (cRes.status === 'fulfilled') setContacts(cRes.value.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Maps for quick lookup
  const dealMap    = useMemo(() => Object.fromEntries(deals.map((d) => [d.id, d])), [deals]);
  const contactMap = useMemo(() => Object.fromEntries(contacts.map((c) => [c.id, c])), [contacts]);

  // Client name helper
  const clientName = (q) => {
    if (q.clientId && contactMap[q.clientId]) return contactMap[q.clientId].name;
    const deal = dealMap[q.dealId];
    if (deal?.clientId && contactMap[deal.clientId]) return contactMap[deal.clientId].name;
    return '—';
  };

  // Deal vínculo helper
  const dealVinculo = (q) => {
    const deal = dealMap[q.dealId];
    if (!deal) return null;
    const parts = [
      clientName(q),
      deal.endEmpreendimento,
      deal.registro,
    ].filter(Boolean);
    return { label: 'Empreendimento', detail: parts.join(' — ') };
  };

  // Summary per status
  const summary = useMemo(() => {
    const base = { Rascunho: { count: 0, value: 0 }, Enviado: { count: 0, value: 0 }, Aprovado: { count: 0, value: 0 }, Recusado: { count: 0, value: 0 } };
    quotes.forEach((q) => {
      if (base[q.status]) {
        base[q.status].count++;
        base[q.status].value += q.valor || 0;
      }
    });
    return base;
  }, [quotes]);

  // Unique clients for dropdown
  const clientOptions = useMemo(() => {
    const seen = new Set();
    const opts = [{ value: '', label: 'Todos os clientes' }];
    quotes.forEach((q) => {
      const name = clientName(q);
      if (name && name !== '—' && !seen.has(name)) {
        seen.add(name);
        opts.push({ value: name, label: name });
      }
    });
    return opts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes, contactMap, dealMap]);

  // Filtered list
  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      if (filterStatus && q.status !== filterStatus) return false;
      if (filterClient) {
        const cn = clientName(q);
        if (cn !== filterClient) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        const cn = clientName(q).toLowerCase();
        if (
          !q.numero?.toLowerCase().includes(s) &&
          !q.titulo?.toLowerCase().includes(s) &&
          !cn.includes(s)
        ) return false;
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes, filterStatus, filterClient, search, contactMap, dealMap]);

  const changeStatus = async (id, newStatus) => {
    try {
      await api.put(`/commercial/quotes/${id}/status`, { status: newStatus });
      fetchAll();
    } catch (err) { alert(err.response?.data?.error || 'Erro ao atualizar status'); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Orçamentos</h1>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-erplus-accent text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition shadow-sm"
        >
          <Plus size={16} /> Novo Orçamento
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {STATUS_LIST.map((s) => (
          <SummaryCard
            key={s}
            label={s}
            count={summary[s]?.count ?? 0}
            value={summary[s]?.value ?? 0}
            active={filterStatus === s}
            onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
          />
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar orçamento..."
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm w-52 focus:outline-none focus:ring-2 focus:ring-erplus-accent/20 focus:border-erplus-accent"
            />
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterStatus('')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
                filterStatus === ''
                  ? 'border-erplus-accent text-erplus-accent bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Todos
            </button>
            {STATUS_LIST.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filterStatus === s
                    ? 'bg-gray-100 text-gray-800 font-semibold'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Client filter */}
          <div className="ml-auto flex items-center gap-3">
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-erplus-accent/20 focus:border-erplus-accent bg-white"
            >
              {clientOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Count */}
            <span className="text-sm text-gray-400 whitespace-nowrap">
              {filtered.length} orçamento(s)
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Nº</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Cliente</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Título</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Vínculo</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Valor</th>
              <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-16 text-gray-400">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-gray-400">
                  <div className="text-3xl mb-2">📋</div>
                  <div className="text-sm">Nenhum orçamento encontrado</div>
                </td>
              </tr>
            ) : filtered.map((q) => {
              const vinculo = dealVinculo(q);
              return (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  {/* Nº */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-erplus-accent">{q.numero}</span>
                  </td>

                  {/* Cliente */}
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-gray-800">{clientName(q)}</span>
                  </td>

                  {/* Título */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-700">{q.titulo}</span>
                  </td>

                  {/* Vínculo */}
                  <td className="px-5 py-4 max-w-xs">
                    {vinculo ? (
                      <div>
                        <span className="text-xs font-semibold text-blue-500 block mb-0.5">{vinculo.label}</span>
                        <span className="text-xs text-gray-400 leading-snug">{vinculo.detail}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Valor */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <span className="text-sm font-bold text-erplus-accent">{R$(q.valor)}</span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 text-center">
                    <StatusDropdown quoteId={q.id} current={q.status} onChange={changeStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && <QuoteModal onClose={() => setModal(false)} onSaved={fetchAll} />}
    </div>
  );
}
