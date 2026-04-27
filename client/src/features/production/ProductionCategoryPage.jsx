import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Save, Trash2, Edit, Clock, LayoutList, Kanban } from 'lucide-react';
import api from '../../services/api';
import { fmtDate } from '../../utils/date';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';

const STATUSES = ['Não iniciado', 'Em andamento', 'Em revisão', 'Finalizado'];

const STATUS_STYLES = {
  'Não iniciado': {
    header: 'bg-gray-100 border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-400',
    drag: 'bg-gray-50/70',
  },
  'Em andamento': {
    header: 'bg-blue-50 border-blue-100',
    badge: 'bg-blue-100 text-blue-600',
    dot: 'bg-blue-500',
    drag: 'bg-blue-50/70',
  },
  'Em revisão': {
    header: 'bg-amber-50 border-amber-100',
    badge: 'bg-amber-100 text-amber-600',
    dot: 'bg-amber-400',
    drag: 'bg-amber-50/70',
  },
  'Finalizado': {
    header: 'bg-green-50 border-green-100',
    badge: 'bg-green-100 text-green-600',
    dot: 'bg-green-500',
    drag: 'bg-green-50/70',
  },
};

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

function KanbanCard({ item, onEdit, onDelete }) {
  const st = STATUS_STYLES[item.status] || STATUS_STYLES['Não iniciado'];
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('itemId', item.id.toString())}
      className="bg-white rounded-xl border border-gray-100 p-3 mb-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div className="text-sm font-semibold text-gray-900 leading-snug flex-1">{item.title}</div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className="p-1 text-gray-300 hover:text-blue-500 rounded"
          >
            <Edit size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="p-1 text-gray-300 hover:text-red-500 rounded"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {item.description && (
        <div className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</div>
      )}
      {item.prodItemTypeName && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">
          {item.prodItemTypeName}
        </span>
      )}
      {item.due && (
        <div className={`flex items-center gap-1 text-xs mt-1.5 ${item.isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
          <Clock size={10} />
          {fmtDate(item.due)}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ status, items, onStatusDrop, onEdit, onDelete }) {
  const [dragOver, setDragOver] = useState(false);
  const st = STATUS_STYLES[status] || STATUS_STYLES['Não iniciado'];

  return (
    <div
      className={`flex-shrink-0 w-64 flex flex-col rounded-xl border transition ${dragOver ? st.drag + ' border-opacity-60' : 'bg-gray-50/60 border-gray-100'}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const id = e.dataTransfer.getData('itemId');
        if (id) onStatusDrop(Number(id), status);
      }}
    >
      <div className={`px-3 py-2.5 rounded-t-xl border-b ${st.header}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${st.dot}`} />
            <span className="text-xs font-bold text-gray-700">{status}</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.badge}`}>
            {items.length}
          </span>
        </div>
      </div>
      <div className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {items.map((item) => (
          <KanbanCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-xs text-gray-300">Arraste um card aqui</div>
        )}
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
  const [view, setView] = useState('list'); // 'list' | 'kanban'

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
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${view === 'list' ? 'bg-white shadow-sm text-erplus-accent' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutList size={14} />
              Lista
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${view === 'kanban' ? 'bg-white shadow-sm text-erplus-accent' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Kanban size={14} />
              Kanban
            </button>
          </div>
          <button
            onClick={() => setModal('new')}
            className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700"
          >
            <Plus size={16} /> Novo Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : view === 'kanban' ? (
        /* ── Kanban View ── */
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              items={items.filter((i) => i.status === status)}
              onStatusDrop={handleStatusChange}
              onEdit={(item) => setModal(item)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        /* ── List View ── */
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
