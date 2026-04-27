import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Save, Trash2, Edit, Clock } from 'lucide-react';
import api from '../../services/api';
import { fmtDate } from '../../utils/date';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';

const STATUSES = ['Não iniciado', 'Em andamento', 'Em revisão', 'Finalizado'];

function ItemModal({ item, category, onClose, onSaved }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    title: item?.title || '',
    description: item?.description || '',
    status: item?.status || 'Não iniciado',
    responsibleId: item?.responsibleId || 1,
    due: item?.due?.slice(0, 10) || '',
    category: item?.category || category,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, responsibleId: Number(form.responsibleId), due: form.due || null };
      if (isEdit) await api.put(`/production/items/${item.id}`, payload);
      else await api.post('/production/items', payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? 'Editar Item' : 'Novo Item'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prazo</label>
            <DatePicker
              value={form.due}
              onChange={(v) => setForm({ ...form, due: v })}
              className="w-full"
            />
          </div>
          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
              <Select
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v })}
                options={STATUSES}
                className="w-full"
              />
            </div>
          )}
        </div>
        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={14} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Página genérica para uma categoria de produção.
 * Reutilizada pelas 8 rotas /producao/{categoria}.
 */
export default function ProductionCategoryPage({ category, label, color }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/production/items?category=${category}`);
      setItems(r.data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (id, newStatus) => {
    await api.put(`/production/items/${id}`, { status: newStatus });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir?')) return;
    await api.delete(`/production/items/${id}`);
    fetchData();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {color && <div className="w-3 h-3 rounded-full" style={{ background: color }} />}
          <h1 className="text-xl font-extrabold text-erplus-text">{label}</h1>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700"
        >
          <Plus size={16} /> Novo Item
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
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
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    Nenhum item em {label}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="text-sm font-semibold">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                      )}
                      {item.prodItemTypeName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">
                          {item.prodItemTypeName}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {item.due ? (
                        <span
                          className={`text-sm flex items-center gap-1 ${
                            item.isOverdue ? 'text-red-500 font-semibold' : 'text-gray-600'
                          }`}
                        >
                          <Clock size={12} />
                          {fmtDate(item.due)}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Select
                        value={item.status}
                        onChange={(v) => handleStatusChange(item.id, v)}
                        options={STATUSES}
                        size="sm"
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModal(item)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ItemModal
          item={modal === 'new' ? null : modal}
          category={category}
          onClose={() => setModal(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
