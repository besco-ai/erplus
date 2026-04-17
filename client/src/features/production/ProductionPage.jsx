import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Save, Trash2, Edit, Clock } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';

const CATEGORIES = [
  { key: 'licenciamentos', label: 'Licenciamentos', color: '#F59E0B' },
  { key: 'design', label: 'Design Criativo', color: '#EC4899' },
  { key: 'projetos', label: 'Projetos', color: '#7C3AED' },
  { key: 'revisao_tecnica', label: 'Revisões Técnicas', color: '#8B5CF6' },
  { key: 'incorporacoes', label: 'Incorporações', color: '#3B82F6' },
  { key: 'supervisao', label: 'Supervisões', color: '#06B6D4' },
  { key: 'vistorias', label: 'Vistorias', color: '#10B981' },
  { key: 'averbacoes', label: 'Averbações', color: '#F97316' },
];
const STATUSES = ['Não iniciado', 'Em andamento', 'Em revisão', 'Finalizado'];

function ItemModal({ item, activeCategory, onClose, onSaved }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    title: item?.title || '', description: item?.description || '',
    status: item?.status || 'Não iniciado', responsibleId: item?.responsibleId || 1,
    due: item?.due?.slice(0, 10) || '', category: item?.category || activeCategory,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, responsibleId: Number(form.responsibleId), due: form.due || null };
      if (isEdit) await api.put(`/production/items/${item.id}`, payload);
      else await api.post('/production/items', payload);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? 'Editar Item' : 'Novo Item de Produção'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Categoria</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prazo</label>
              <input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
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

export default function ProductionPage({ mine = false }) {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);
  const [activeCategory, setActiveCategory] = useState('licenciamentos');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const userFilter = mine && user?.id ? `&responsibleId=${user.id}` : '';
      const [iRes, sRes] = await Promise.all([
        api.get(`/production/items?category=${activeCategory}${userFilter}`),
        api.get('/production/summary'),
      ]);
      setItems(iRes.data);
      setSummary(sRes.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [activeCategory, mine, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (id, newStatus) => {
    await api.put(`/production/items/${id}`, { status: newStatus });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir?')) return;
    await api.delete(`/production/items/${id}`);
    fetchData();
  };

  const activeCat = CATEGORIES.find((c) => c.key === activeCategory);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-erplus-text">Produção</h1>
        <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          <Plus size={16} /> Novo Item
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 bg-gray-100 rounded-lg p-1">
        {CATEGORIES.map((cat) => {
          const s = summary.find((x) => x.category === cat.key);
          return (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeCategory === cat.key ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
              {cat.label}
              {s && s.total > 0 && <span className="text-xs text-gray-400">({s.total})</span>}
            </button>
          );
        })}
      </div>

      {/* Items list with status */}
      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Item</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Prazo</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">Nenhum item em {activeCat?.label}</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="text-sm font-semibold">{item.title}</div>
                    {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                    {item.prodItemTypeName && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">{item.prodItemTypeName}</span>}
                  </td>
                  <td className="px-5 py-3">
                    {item.due ? (
                      <span className={`text-sm flex items-center gap-1 ${item.isOverdue ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
                        <Clock size={12} />{new Date(item.due).toLocaleDateString('pt-BR')}
                      </span>
                    ) : <span className="text-gray-300 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded text-xs font-medium">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <ItemModal item={modal === 'new' ? null : modal} activeCategory={activeCategory} onClose={() => setModal(null)} onSaved={fetchData} />}
    </div>
  );
}
