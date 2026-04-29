import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Save, Search } from 'lucide-react';
import api from '../../services/api';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';
import { fmtDate } from '../../utils/date';

const FORMAS_PAGAMENTO = ['Boleto', 'PIX', 'Transferência Bancária', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Cheque'];

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const STATUS_LIST = ['Vigente', 'Encerrado', 'Cancelado', 'Suspenso'];

const statusStyle = {
  Vigente:   { badge: 'bg-green-50 text-green-600',   dot: 'bg-green-500' },
  Encerrado: { badge: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400' },
  Cancelado: { badge: 'bg-red-50 text-red-500',       dot: 'bg-red-400' },
  Suspenso:  { badge: 'bg-orange-50 text-orange-500', dot: 'bg-orange-400' },
};

// ── Card de status ─────────────────────────────────────────────────────────────
function StatusCard({ label, count, value, active, onClick }) {
  const cfg = statusStyle[label] || statusStyle.Vigente;
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

// ── Modal novo contrato ────────────────────────────────────────────────────────
function ContractModal({ onClose, onSaved }) {
  const [deals,    setDeals]    = useState([]);
  const [contacts, setContacts] = useState([]);
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    titulo: '', clientId: '', valor: '0', dealId: '',
    dataInicio: today, dataFim: '',
    formaPagamento: 'Boleto', numeroParcelas: '1', dataPrimeiroPagamento: today,
  });
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get('/commercial/deals'),
      api.get('/contacts'),
    ]).then(([dRes, cRes]) => {
      if (dRes.status === 'fulfilled') setDeals(dRes.value.data);
      if (cRes.status === 'fulfilled') setContacts(cRes.value.data);
    });
  }, []);

  const handleDealChange = (dealId) => {
    const deal = deals.find((d) => String(d.id) === String(dealId));
    setForm((p) => ({
      ...p, dealId,
      clientId: deal?.clientId     ? String(deal.clientId) : p.clientId,
      titulo:   deal?.title        || p.titulo,
      valor:    deal?.value        ? String(deal.value)    : p.valor,
    }));
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { setError('Título é obrigatório'); return; }
    if (!form.clientId)      { setError('Cliente é obrigatório'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/commercial/contracts', {
        titulo:                form.titulo.trim(),
        clientId:              Number(form.clientId),
        valor:                 Number(form.valor) || 0,
        dealId:                form.dealId ? Number(form.dealId) : null,
        dataInicio:            form.dataInicio || null,
        dataFim:               form.dataFim    || null,
        formaPagamento:        form.formaPagamento,
        numeroParcelas:        Number(form.numeroParcelas) || 1,
        dataPrimeiroPagamento: form.dataPrimeiroPagamento || null,
        responsibleId:         1,
      });
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const lbl = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';
  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20 focus:border-erplus-accent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-gray-900">Novo Contrato</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Título */}
          <div>
            <label className={lbl}>Título *</label>
            <input value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              placeholder="Ex: Contrato de Incorporação" className={inp} />
          </div>

          {/* Cliente + Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Cliente</label>
              <Select
                value={form.clientId}
                onChange={(v) => setForm((p) => ({ ...p, clientId: v }))}
                options={contacts.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="— Selecionar —"
                className="w-full"
              />
            </div>
            <div>
              <label className={lbl}>Valor Total (R$)</label>
              <input type="number" step="0.01" min="0" value={form.valor}
                onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))} className={inp} />
            </div>
          </div>

          {/* Vincular a negócio */}
          <div>
            <label className={lbl}>Vincular a Negócio (opcional)</label>
            <Select
              value={form.dealId}
              onChange={handleDealChange}
              options={[
                { value: '', label: '— Nenhum —' },
                ...deals.map((d) => ({ value: d.id, label: d.title || `Negócio #${d.id}` })),
              ]}
              placeholder="— Nenhum —"
              className="w-full"
            />
          </div>

          {/* Data início + Data término */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Data de Início</label>
              <DatePicker value={form.dataInicio}
                onChange={(v) => setForm((p) => ({ ...p, dataInicio: v }))} className="w-full" />
            </div>
            <div>
              <label className={lbl}>Data de Término</label>
              <DatePicker value={form.dataFim}
                onChange={(v) => setForm((p) => ({ ...p, dataFim: v }))} className="w-full" />
            </div>
          </div>

          {/* Forma pagamento + Parcelas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Forma de Pagamento</label>
              <Select
                value={form.formaPagamento}
                onChange={(v) => setForm((p) => ({ ...p, formaPagamento: v }))}
                options={FORMAS_PAGAMENTO.map((f) => ({ value: f, label: f }))}
                className="w-full"
              />
            </div>
            <div>
              <label className={lbl}>Número de Parcelas</label>
              <input type="number" min="1" value={form.numeroParcelas}
                onChange={(e) => setForm((p) => ({ ...p, numeroParcelas: e.target.value }))} className={inp} />
            </div>
          </div>

          {/* Data 1º pagamento */}
          <div>
            <label className={lbl}>Data do 1º Pagamento</label>
            <DatePicker value={form.dataPrimeiroPagamento}
              onChange={(v) => setForm((p) => ({ ...p, dataPrimeiroPagamento: v }))} className="w-full" />
          </div>
        </div>

        {error && <div className="mx-6 mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="flex justify-end gap-2 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 hover:bg-red-700 transition">
            <Save size={14} />{saving ? 'Criando...' : 'Criar Contrato'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [contacts,  setContacts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [modal, setModal] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, ctRes] = await Promise.allSettled([
        api.get('/commercial/contracts'),
        api.get('/contacts'),
      ]);
      if (cRes.status  === 'fulfilled') setContracts(cRes.value.data);
      if (ctRes.status === 'fulfilled') setContacts(ctRes.value.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const contactMap = useMemo(() =>
    Object.fromEntries(contacts.map((c) => [c.id, c])), [contacts]);

  const clientName = (c) =>
    contactMap[c.clientId]?.name || '—';

  // Summaries por status
  const summary = useMemo(() => {
    const base = Object.fromEntries(STATUS_LIST.map((s) => [s, { count: 0, value: 0 }]));
    contracts.forEach((c) => {
      if (base[c.status]) { base[c.status].count++; base[c.status].value += c.valor || 0; }
    });
    return base;
  }, [contracts]);

  // Totais financeiros
  const totalContratado = contracts.reduce((s, c) => s + (c.valor || 0), 0);
  const totalPago       = contracts.filter((c) => c.status === 'Encerrado').reduce((s, c) => s + (c.valor || 0), 0);
  const totalAReceber   = contracts.filter((c) => c.status === 'Vigente' || c.status === 'Suspenso').reduce((s, c) => s + (c.valor || 0), 0);

  // Clientes únicos
  const clientOptions = useMemo(() => {
    const seen = new Set();
    const opts = [{ value: '', label: 'Todos os clientes' }];
    contracts.forEach((c) => {
      const name = clientName(c);
      if (name && name !== '—' && !seen.has(name)) { seen.add(name); opts.push({ value: name, label: name }); }
    });
    return opts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts, contactMap]);

  // Lista filtrada
  const filtered = useMemo(() => contracts.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterClient && clientName(c) !== filterClient) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!c.numero?.toLowerCase().includes(s) &&
          !c.titulo?.toLowerCase().includes(s) &&
          !clientName(c).toLowerCase().includes(s)) return false;
    }
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [contracts, filterStatus, filterClient, search, contactMap]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Contratos</h1>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-erplus-accent text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition shadow-sm"
        >
          <Plus size={16} /> Novo Contrato
        </button>
      </div>

      {/* Cards de status */}
      <div className="grid grid-cols-4 gap-4">
        {STATUS_LIST.map((s) => (
          <StatusCard
            key={s}
            label={s}
            count={summary[s]?.count ?? 0}
            value={summary[s]?.value ?? 0}
            active={filterStatus === s}
            onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
          />
        ))}
      </div>

      {/* Totais financeiros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm grid grid-cols-3 divide-x divide-gray-100">
        <div className="px-6 py-5 border-l-4 border-l-erplus-accent rounded-l-2xl">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Contratado</div>
          <div className="text-2xl font-extrabold text-erplus-accent">{R$(totalContratado)}</div>
          <div className="text-xs text-gray-400 mt-1">{contracts.length} contrato(s)</div>
        </div>
        <div className="px-6 py-5 border-l-4 border-l-green-500">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Pago</div>
          <div className="text-2xl font-extrabold text-green-500">{R$(totalPago)}</div>
        </div>
        <div className="px-6 py-5 border-l-4 border-l-amber-400 rounded-r-2xl">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">A Receber</div>
          <div className="text-2xl font-extrabold text-amber-500">{R$(totalAReceber)}</div>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar contrato..."
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm w-52 focus:outline-none focus:ring-2 focus:ring-erplus-accent/20 focus:border-erplus-accent"
            />
          </div>

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

          <div className="ml-auto flex items-center gap-3">
            <Select
              value={filterClient}
              onChange={(v) => setFilterClient(v)}
              options={clientOptions}
              placeholder="Todos os clientes"
            />
            <span className="text-sm text-gray-400 whitespace-nowrap">{filtered.length} contrato(s)</span>
          </div>
        </div>
      </div>

      {/* Tabela / empty state */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm px-6">
            {contracts.length === 0
              ? 'Contratos são gerados quando um orçamento é marcado como "Ganho" dentro do cartão, ou criados manualmente acima.'
              : 'Nenhum contrato encontrado com os filtros selecionados.'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Nº</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Título</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Início</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Encerramento</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Valor</th>
                <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Origem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const cfg = statusStyle[c.status] || statusStyle.Vigente;
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-erplus-accent">{c.numero}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-800">{clientName(c)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-700">{c.titulo}</div>
                      {c.endEmpreendimento && <div className="text-xs text-gray-400 truncate max-w-xs">{c.endEmpreendimento}</div>}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{fmtDate(c.dataInicio)}</td>
                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{fmtDate(c.dataFim) || '—'}</td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <span className="text-sm font-bold text-erplus-accent">{R$(c.valor)}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.badge}`}>{c.status}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {c.quoteId
                        ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">Via orçamento</span>
                        : <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">Manual</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ContractModal onClose={() => setModal(false)} onSaved={fetchAll} />}
    </div>
  );
}
