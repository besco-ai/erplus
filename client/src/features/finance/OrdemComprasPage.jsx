import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Save, Trash2, Edit, ShoppingCart } from 'lucide-react';
import api from '../../services/api';
import DatePicker from '../../components/ui/DatePicker';
import { fmtDate } from '../../utils/date';

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const STATUSES = ['Rascunho', 'Enviada', 'Aprovada', 'Recebida', 'Cancelada'];
const STATUS_COLORS = {
  Rascunho: 'bg-gray-100 text-gray-600',
  Enviada: 'bg-blue-50 text-blue-600',
  Aprovada: 'bg-green-50 text-green-600',
  Recebida: 'bg-emerald-50 text-emerald-700',
  Cancelada: 'bg-red-50 text-red-500',
};

function OrdemModal({ item, fornecedores, costCenters, onClose, onSaved }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    titulo: item?.titulo || '',
    fornecedorId: item?.fornecedorId ?? '',
    data: item?.data?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    prazoEntrega: item?.prazoEntrega?.slice(0, 10) || '',
    valor: item?.valor ?? 0,
    status: item?.status || 'Rascunho',
    costCenterId: item?.costCenterId ?? '',
    observacoes: item?.observacoes || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        titulo: form.titulo,
        fornecedorId: form.fornecedorId ? Number(form.fornecedorId) : null,
        data: form.data,
        prazoEntrega: form.prazoEntrega || null,
        valor: Number(form.valor),
        costCenterId: form.costCenterId ? Number(form.costCenterId) : null,
        observacoes: form.observacoes || null,
        ...(isEdit ? { status: form.status } : {}),
      };
      if (isEdit) await api.put(`/finance/purchase-orders/${item.id}`, payload);
      else await api.post('/finance/purchase-orders', payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? `Editar ${item.numero}` : 'Nova Ordem de Compra'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fornecedor</label>
              <select
                value={form.fornecedorId}
                onChange={(e) => setForm({ ...form, fornecedorId: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">—</option>
                {fornecedores.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Valor</label>
              <input
                type="number" step="0.01"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data</label>
              <DatePicker
                value={form.data}
                onChange={(v) => setForm({ ...form, data: v })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prazo entrega</label>
              <DatePicker
                value={form.prazoEntrega}
                onChange={(v) => setForm({ ...form, prazoEntrega: v })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Centro de custo</label>
              <select
                value={form.costCenterId}
                onChange={(e) => setForm({ ...form, costCenterId: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">—</option>
                {costCenters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {isEdit && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>
        </div>
        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.titulo}
            className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdemComprasPage() {
  const [orders, setOrders] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [po, cc, ct] = await Promise.all([
        api.get(`/finance/purchase-orders${statusFilter ? `?status=${statusFilter}` : ''}`),
        api.get('/finance/cost-centers'),
        api.get('/crm/contacts?type=Fornecedor'),
      ]);
      setOrders(Array.isArray(po.data) ? po.data : (po.data?.items ?? []));
      setCostCenters(Array.isArray(cc.data) ? cc.data : (cc.data?.items ?? []));
      setFornecedores(Array.isArray(ct.data) ? ct.data : (ct.data?.items ?? []));
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta ordem de compra?')) return;
    await api.delete(`/finance/purchase-orders/${id}`);
    fetchData();
  };

  const forneName = (id) => fornecedores.find((f) => f.id === id)?.name || '—';

  const totalPorStatus = STATUSES.map((s) => ({
    status: s,
    count: orders.filter((o) => o.status === s).length,
    value: orders.filter((o) => o.status === s).reduce((sum, o) => sum + o.valor, 0),
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-erplus-text flex items-center gap-2">
          <ShoppingCart size={22} /> Cotações / Ordens de Compra
        </h1>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700"
        >
          <Plus size={16} /> Nova Cotação
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {totalPorStatus.map((s) => (
          <div key={s.status} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status]}`}>
                {s.status}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-erplus-text">{s.count}</div>
            <div className="text-xs text-gray-400 mt-1">{R$(s.value)}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase">Filtrar:</span>
        <button
          onClick={() => setStatusFilter('')}
          className={`text-xs px-3 py-1.5 rounded-full font-medium ${!statusFilter ? 'bg-erplus-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Todas
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusFilter === s ? 'bg-erplus-accent text-white' : `${STATUS_COLORS[s]} hover:opacity-80`}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Nº</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Título</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Fornecedor</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Data</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Prazo</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Valor</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Nenhuma ordem de compra</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{o.numero}</td>
                  <td className="px-5 py-3">
                    <div className="text-sm font-semibold">{o.titulo}</div>
                    {o.costCenterName && (
                      <div className="text-[10px] text-gray-400 mt-0.5">{o.costCenterName}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{forneName(o.fornecedorId)}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{fmtDate(o.data)}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{fmtDate(o.prazoEntrega)}</td>
                  <td className="px-5 py-3 text-right font-bold text-sm">{R$(o.valor)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] || 'bg-gray-100'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(o)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(o.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <OrdemModal
          item={modal === 'new' ? null : modal}
          fornecedores={fornecedores}
          costCenters={costCenters}
          onClose={() => setModal(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
