import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Save, FileText, Edit, Trash2, Check, XCircle, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import DatePicker from '../../components/ui/DatePicker';
import { fmtDate } from '../../utils/date';
import Select from '../../components/ui/Select';

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const statusConfig = {
  Rascunho: { bg: 'bg-gray-100', text: 'text-gray-600' },
  Enviado: { bg: 'bg-blue-50', text: 'text-blue-600' },
  Aprovado: { bg: 'bg-green-50', text: 'text-green-600' },
  Recusado: { bg: 'bg-red-50', text: 'text-red-600' },
};

function QuoteModal({ quote, onClose, onSaved }) {
  const isEdit = !!quote;
  const [deals, setDeals] = useState([]);
  const [form, setForm] = useState({
    dealId: quote?.dealId || '', titulo: quote?.titulo || '',
    clientId: quote?.clientId || '', valor: quote?.valor || '',
    validade: quote?.validade?.slice(0, 10) || '', conditions: quote?.conditions || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/commercial/deals').then(({ data }) => setDeals(data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = {
        ...form, dealId: Number(form.dealId), clientId: Number(form.clientId) || undefined,
        valor: Number(form.valor), validade: form.validade || null,
      };
      await api.post('/commercial/quotes', payload);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Novo Orçamento</h3>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Negócio *</label>
            <Select
              value={form.dealId}
              onChange={(v) => setForm({ ...form, dealId: v })}
              options={deals.map((d) => ({ value: d.id, label: d.title || `Deal #${d.id}` }))}
              placeholder="— Selecionar —"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Valor *</label>
              <input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Validade</label>
              <DatePicker value={form.validade} onChange={(v) => setForm({ ...form, validade: v })}
                className="w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Condições de pagamento</label>
            <input value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              placeholder="Ex: 3x sem juros" className="w-full" />
          </div>
        </div>
        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 flex items-center gap-2">
            <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/commercial/quotes');
      setQuotes(data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const changeStatus = async (id, newStatus) => {
    const labels = { Aprovado: 'APROVAR', Recusado: 'RECUSAR', Enviado: 'marcar como ENVIADO' };
    if (!confirm(`${labels[newStatus] || newStatus} este orçamento?`)) return;
    try {
      await api.put(`/commercial/quotes/${id}/status`, { status: newStatus });
      fetchQuotes();
    } catch (err) { alert(err.response?.data?.error || 'Erro'); }
  };

  const deleteQuote = async (id) => {
    if (!confirm('Excluir orçamento?')) return;
    try { await api.delete(`/commercial/quotes/${id}`); fetchQuotes(); } catch { /* silent */ }
  };

  const filtered = filterStatus ? quotes.filter((q) => q.status === filterStatus) : quotes;

  const summary = {
    total: quotes.length,
    rascunho: quotes.filter((q) => q.status === 'Rascunho').length,
    enviado: quotes.filter((q) => q.status === 'Enviado').length,
    aprovado: quotes.filter((q) => q.status === 'Aprovado').length,
    recusado: quotes.filter((q) => q.status === 'Recusado').length,
    valorTotal: quotes.reduce((s, q) => s + (q.valor || 0), 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-erplus-text">Orçamentos</h1>
          <p className="text-sm text-erplus-text-muted mt-1">{summary.total} orçamento(s) · {R$(summary.valorTotal)} total</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          <Plus size={16} /> Novo Orçamento
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2">
        {[{ key: '', label: `Todos (${summary.total})` },
          { key: 'Rascunho', label: `Rascunho (${summary.rascunho})` },
          { key: 'Enviado', label: `Enviado (${summary.enviado})` },
          { key: 'Aprovado', label: `Aprovado (${summary.aprovado})` },
          { key: 'Recusado', label: `Recusado (${summary.recusado})` },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilterStatus(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatus === f.key ? 'bg-erplus-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Número</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Título</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Data</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Validade</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Valor</th>
              <th className="text-center px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Nenhum orçamento</td></tr>
            ) : filtered.map((q) => {
              const sc = statusConfig[q.status] || statusConfig.Rascunho;
              return (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-erplus-accent">{q.numero}</span>
                  </td>
                  <td className="px-5 py-3 text-sm font-medium">{q.titulo}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{fmtDate(q.data)}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{fmtDate(q.validade)}</td>
                  <td className="px-5 py-3 text-sm font-bold text-right">{R$(q.valor)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>{q.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {q.status === 'Rascunho' && (
                        <button onClick={() => changeStatus(q.id, 'Enviado')} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Enviar">
                          <FileText size={14} />
                        </button>
                      )}
                      {q.status === 'Enviado' && (
                        <>
                          <button onClick={() => changeStatus(q.id, 'Aprovado')} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Aprovar">
                            <Check size={14} />
                          </button>
                          <button onClick={() => changeStatus(q.id, 'Recusado')} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Recusar">
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      {(q.status === 'Aprovado' || q.status === 'Recusado') && (
                        <button onClick={() => changeStatus(q.id, 'Enviado')} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Reverter">
                          <RotateCcw size={14} />
                        </button>
                      )}
                      <button onClick={() => deleteQuote(q.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && <QuoteModal onClose={() => setModal(false)} onSaved={fetchQuotes} />}
    </div>
  );
}
