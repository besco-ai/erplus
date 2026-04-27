import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Save, FileText, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import DatePicker from '../../components/ui/DatePicker';
import { fmtDate } from '../../utils/date';
import Select from '../../components/ui/Select';

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const statusBadge = (status) => {
  const colors = {
    Vigente: 'bg-green-50 text-green-600',
    Encerrado: 'bg-gray-100 text-gray-500',
    Cancelado: 'bg-red-50 text-red-600',
  };
  const c = colors[status] || colors.Vigente;
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${c}`}>{status}</span>;
};

function ContractModal({ onClose, onSaved }) {
  const [deals, setDeals] = useState([]);
  const [form, setForm] = useState({
    dealId: '', clientId: '', titulo: '', valor: '', responsibleId: 1, dataFim: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/commercial/deals').then(({ data }) => setDeals(data)).catch(() => {});
  }, []);

  const handleDealChange = (dealId) => {
    const deal = deals.find((d) => d.id === Number(dealId));
    setForm({
      ...form, dealId,
      clientId: deal?.clientId || '',
      titulo: deal?.title || '',
      valor: deal?.value || '',
      responsibleId: deal?.responsibleId || 1,
    });
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await api.post('/commercial/contracts', {
        dealId: Number(form.dealId), clientId: Number(form.clientId),
        titulo: form.titulo, valor: Number(form.valor),
        responsibleId: Number(form.responsibleId),
        dataFim: form.dataFim || null,
      });
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Novo Contrato</h3>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Negócio vinculado *</label>
            <Select
              value={form.dealId}
              onChange={(v) => handleDealChange(v)}
              options={deals.map((d) => ({ value: d.id, label: d.title || `Deal #${d.id}` }))}
              placeholder="— Selecionar —"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título</label>
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Valor</label>
              <input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data fim</label>
              <DatePicker value={form.dataFim} onChange={(v) => setForm({ ...form, dataFim: v })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
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

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/commercial/contracts');
      setContracts(data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const totalValor = contracts.reduce((s, c) => s + (c.valor || 0), 0);
  const vigentes = contracts.filter((c) => c.status === 'Vigente').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-erplus-text">Contratos</h1>
          <p className="text-sm text-erplus-text-muted mt-1">{contracts.length} contrato(s) · {vigentes} vigente(s) · {R$(totalValor)}</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          <Plus size={16} /> Novo Contrato
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Número</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Título</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Início</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Fim</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Valor</th>
              <th className="text-center px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="text-center px-5 py-3 text-xs font-bold text-gray-500 uppercase">Origem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Carregando...</td></tr>
            ) : contracts.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Nenhum contrato</td></tr>
            ) : contracts.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3"><span className="text-sm font-bold text-erplus-accent">{c.numero}</span></td>
                <td className="px-5 py-3">
                  <div className="text-sm font-medium">{c.titulo}</div>
                  {c.endEmpreendimento && <div className="text-xs text-gray-400 truncate max-w-xs">{c.endEmpreendimento}</div>}
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">{fmtDate(c.dataInicio)}</td>
                <td className="px-5 py-3 text-sm text-gray-500">{fmtDate(c.dataFim)}</td>
                <td className="px-5 py-3 text-sm font-bold text-right">{R$(c.valor)}</td>
                <td className="px-5 py-3 text-center">{statusBadge(c.status)}</td>
                <td className="px-5 py-3 text-center">
                  {c.quoteId ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">Via orçamento</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">Manual</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <ContractModal onClose={() => setModal(false)} onSaved={fetchContracts} />}
    </div>
  );
}
