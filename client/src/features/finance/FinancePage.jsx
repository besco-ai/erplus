import { useState, useEffect, useCallback } from 'react';
import {
  Plus, DollarSign, TrendingUp, TrendingDown, AlertCircle, X, Save,
  Edit, Trash2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import api from '../../services/api';

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const statusBadge = (status) => {
  const colors = {
    'Efetuado': 'bg-green-50 text-green-600',
    'Em aberto': 'bg-blue-50 text-blue-600',
    'Vencido': 'bg-red-50 text-red-600',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[status] || 'bg-gray-100 text-gray-500'}`}>{status}</span>;
};

function EntryModal({ entry, costCenters, bankAccounts, onClose, onSaved }) {
  const isEdit = !!entry;
  const [form, setForm] = useState({
    type: entry?.type || 'receita',
    date: entry?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    description: entry?.description || '',
    costCenterId: entry?.costCenterId || (costCenters[0]?.id || ''),
    accountId: entry?.accountId || (bankAccounts[0]?.id || ''),
    value: entry?.value || '',
    status: entry?.status || 'Em aberto',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, value: Number(form.value), costCenterId: Number(form.costCenterId), accountId: Number(form.accountId) };
      if (isEdit) await api.put(`/finance/entries/${entry.id}`, payload);
      else await api.post('/finance/entries', payload);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descrição *</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Valor *</label>
            <input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
              <option value="Em aberto">Em aberto</option>
              <option value="Efetuado">Efetuado</option>
              <option value="Vencido">Vencido</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Centro de Custo</label>
            <select value={form.costCenterId} onChange={(e) => setForm({ ...form, costCenterId: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
              {costCenters.map((cc) => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Conta</label>
            <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
              {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [tab, setTab] = useState('lancamentos');
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, entRes, recRes, payRes, ccRes, accRes] = await Promise.all([
        api.get('/finance/summary'),
        api.get('/finance/entries'),
        api.get('/finance/receivables'),
        api.get('/finance/payables'),
        api.get('/finance/cost-centers'),
        api.get('/finance/bank-accounts'),
      ]);
      setSummary(sumRes.data);
      setEntries(entRes.data);
      setReceivables(recRes.data);
      setPayables(payRes.data);
      setCostCenters(ccRes.data);
      setBankAccounts(accRes.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const deleteEntry = async (id) => {
    if (!confirm('Excluir lançamento?')) return;
    await api.delete(`/finance/entries/${id}`);
    fetchAll();
  };

  const tabs = [
    { id: 'lancamentos', label: 'Lançamentos' },
    { id: 'receber', label: `A Receber (${receivables.length})` },
    { id: 'pagar', label: `A Pagar (${payables.length})` },
    { id: 'centros', label: 'Centros de Custo' },
    { id: 'contas', label: 'Contas Bancárias' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-erplus-text">Financeiro</h1>
        <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition">
          <Plus size={16} /> Novo Lançamento
        </button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Receitas', value: R$(summary.totalReceitas), icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Despesas', value: R$(summary.totalDespesas), icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Saldo', value: R$(summary.saldo), icon: DollarSign, color: summary.saldo >= 0 ? 'text-green-600' : 'text-red-600', bg: 'bg-gray-50' },
            { label: 'A Receber', value: R$(summary.aReceber), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'A Pagar', value: R$(summary.aPagar), icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">{kpi.label}</span>
                <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon size={14} className={kpi.color} />
                </div>
              </div>
              <div className={`text-lg font-extrabold ${kpi.color}`}>{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.id ? 'bg-white text-erplus-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
        <>
          {/* Lançamentos */}
          {tab === 'lancamentos' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Data</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Descrição</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Centro</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Conta</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Valor</th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm text-gray-600">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {e.type === 'receita'
                            ? <ArrowUpRight size={14} className="text-green-500" />
                            : <ArrowDownRight size={14} className="text-red-500" />}
                          <span className="text-sm font-medium">{e.description}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{e.costCenterName || '—'}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{e.accountName || '—'}</td>
                      <td className={`px-5 py-3 text-sm font-bold text-right ${e.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {e.type === 'despesa' ? '- ' : ''}{R$(e.value)}
                      </td>
                      <td className="px-5 py-3 text-center">{statusBadge(e.status)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setModal(e)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                          <button onClick={() => deleteEntry(e.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {entries.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">Nenhum lançamento</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* A Receber */}
          {tab === 'receber' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Descrição</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Vencimento</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Valor</th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="px-5 py-3 text-sm font-medium">{r.descricao}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{new Date(r.vencimento).toLocaleDateString('pt-BR')}</td>
                      <td className="px-5 py-3 text-sm font-bold text-green-600 text-right">{R$(r.valor)}</td>
                      <td className="px-5 py-3 text-center">{statusBadge(r.status)}</td>
                    </tr>
                  ))}
                  {receivables.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-gray-400">Nenhuma conta a receber</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* A Pagar */}
          {tab === 'pagar' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Descrição</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Vencimento</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Valor</th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payables.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="px-5 py-3 text-sm font-medium">{p.descricao}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{new Date(p.vencimento).toLocaleDateString('pt-BR')}</td>
                      <td className="px-5 py-3 text-sm font-bold text-red-600 text-right">{R$(p.valor)}</td>
                      <td className="px-5 py-3 text-center">{statusBadge(p.status)}</td>
                    </tr>
                  ))}
                  {payables.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-gray-400">Nenhuma conta a pagar</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* Centros de Custo */}
          {tab === 'centros' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {costCenters.map((cc) => (
                <div key={cc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{cc.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cc.type === 'Receita' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{cc.type}</span>
                  </div>
                  <div className="text-xs text-gray-400">{cc.category} · {cc.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* Contas Bancárias */}
          {tab === 'contas' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {bankAccounts.map((acc) => (
                <div key={acc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
                  <div className="text-sm font-semibold text-gray-700 mb-2">{acc.name}</div>
                  <div className="text-2xl font-extrabold text-erplus-accent">{R$(acc.balance)}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modal && (
        <EntryModal
          entry={modal === 'new' ? null : modal}
          costCenters={costCenters}
          bankAccounts={bankAccounts}
          onClose={() => setModal(null)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}
