import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Search, LayoutGrid, List, Trash2,
  Flag, Calendar, X, Edit2,
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';
import { fmtDate } from '../../utils/date';
import Select from '../../components/ui/Select';
import DatePicker from '../../components/ui/DatePicker';

// ─── Constants ───────────────────────────────────────────────────────────────
const STATUSES = ['A Fazer', 'Em Progresso', 'Em Revisão', 'Concluído'];
const PRIORITIES = ['Alta', 'Média', 'Baixa'];

const STATUS_STYLE = {
  'A Fazer':     { dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600',    header: 'border-gray-300'  },
  'Em Progresso':{ dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700',    header: 'border-blue-400'  },
  'Em Revisão':  { dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700',  header: 'border-amber-400' },
  'Concluído':   { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700',  header: 'border-green-400' },
};

const PRIORITY_STYLE = {
  'Alta':  { color: 'text-red-500',   bg: 'bg-red-50',   label: 'Alta'  },
  'Média': { color: 'text-amber-500', bg: 'bg-amber-50', label: 'Média' },
  'Baixa': { color: 'text-blue-400',  bg: 'bg-blue-50',  label: 'Baixa' },
};

// ─── PlanningModal ────────────────────────────────────────────────────────────
function PlanningModal({ open, onClose, onSaved, initial, defaultStatus = 'A Fazer', users }) {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    title: '', description: '', status: 'A Fazer', priority: 'Média',
    responsibleId: user?.id ?? 0, due: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial?.id
        ? {
            title: initial.title,
            description: initial.description ?? '',
            status: initial.status,
            priority: initial.priority,
            responsibleId: initial.responsibleId,
            due: initial.due ?? null,
          }
        : {
            title: '', description: '', status: defaultStatus, priority: 'Média',
            responsibleId: user?.id ?? 0, due: null,
          });
    }
  }, [open, initial, defaultStatus, user]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        status: form.status,
        priority: form.priority,
        responsibleId: Number(form.responsibleId),
        due: form.due || null,
      };
      let res;
      if (initial?.id) {
        res = await api.put(`/plannings/${initial.id}`, payload);
      } else {
        res = await api.post('/plannings', payload);
      }
      onSaved(res.data);
      onClose();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  if (!open) return null;

  const userOptions = users.map((u) => ({ value: u.id, label: u.name || u.email || `#${u.id}` }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">
            {initial?.id ? 'Editar Planejamento' : 'Novo Planejamento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Título *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/30"
              placeholder="Nome do planejamento"
              value={form.title}
              onChange={(e) => set('title')(e.target.value)}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Descrição</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-erplus-accent/30"
              rows={3}
              placeholder="Detalhes opcionais..."
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
            />
          </div>

          {/* Status + Prioridade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
              <Select
                value={form.status}
                onChange={set('status')}
                options={STATUSES}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Prioridade</label>
              <Select
                value={form.priority}
                onChange={set('priority')}
                options={PRIORITIES}
              />
            </div>
          </div>

          {/* Responsável + Prazo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Responsável</label>
              <Select
                value={form.responsibleId}
                onChange={(v) => set('responsibleId')(Number(v))}
                options={userOptions}
                placeholder="Selecionar..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Prazo</label>
              <DatePicker
                value={form.due ? form.due.slice(0, 10) : ''}
                onChange={set('due')}
                placeholder="Selecionar data"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="px-5 py-2 text-sm font-semibold bg-erplus-accent text-white rounded-lg hover:bg-erplus-accent/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : initial?.id ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PlanningCard ─────────────────────────────────────────────────────────────
function PlanningCard({ item, onMove, onEdit, onDelete }) {
  const pri = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE['Média'];
  const isOverdue = item.due && new Date(item.due) < new Date() && item.status !== 'Concluído';

  const otherStatuses = STATUSES.filter((s) => s !== item.status);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow group">
      {/* Priority badge + actions */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pri.bg} ${pri.color} flex items-center gap-1`}>
          <Flag size={9} />
          {item.priority}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Title */}
      <p className={`text-sm font-semibold leading-snug mb-2 ${item.status === 'Concluído' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {item.title}
      </p>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</p>
      )}

      {/* Due date */}
      {item.due && (
        <div className={`flex items-center gap-1 text-xs mb-3 ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
          <Calendar size={11} />
          {fmtDate(item.due)}
          {isOverdue && <span className="ml-1 text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">Atrasado</span>}
        </div>
      )}

      {/* Move to */}
      {otherStatuses.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-50">
          {otherStatuses.map((s) => (
            <button
              key={s}
              onClick={() => onMove(item.id, s)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors hover:opacity-80
                ${STATUS_STYLE[s]?.badge || 'bg-gray-100 text-gray-500'} border-transparent`}
            >
              → {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── KanbanCol ────────────────────────────────────────────────────────────────
function KanbanCol({ status, items, onAdd, onMove, onEdit, onDelete }) {
  const st = STATUS_STYLE[status];
  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] flex-1">
      {/* Column header */}
      <div className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${st.header}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
          <span className="text-sm font-bold text-gray-700">{status}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.badge}`}>
            {items.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(status)}
          className="p-1 text-gray-400 hover:text-erplus-accent transition-colors rounded-lg hover:bg-gray-100"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 flex-1">
        {items.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-xs text-gray-300">Nenhum item</p>
          </div>
        )}
        {items.map((item) => (
          <PlanningCard
            key={item.id}
            item={item}
            onMove={onMove}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────
function ListView({ items, onEdit, onDelete, onMove }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <th className="text-left px-4 py-3 font-semibold">Título</th>
            <th className="text-left px-4 py-3 font-semibold">Status</th>
            <th className="text-left px-4 py-3 font-semibold">Prioridade</th>
            <th className="text-left px-4 py-3 font-semibold">Prazo</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-10 text-gray-300">
                Nenhum planejamento encontrado
              </td>
            </tr>
          )}
          {items.map((item) => {
            const st = STATUS_STYLE[item.status] || STATUS_STYLE['A Fazer'];
            const pri = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE['Média'];
            const isOverdue = item.due && new Date(item.due) < new Date() && item.status !== 'Concluído';
            return (
              <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className={`font-medium ${item.status === 'Concluído' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {item.title}
                  </span>
                  {item.description && (
                    <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{item.description}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.badge}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold ${pri.color}`}>
                    <Flag size={10} className="inline mr-1" />{item.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {item.due ? (
                    <span className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                      {fmtDate(item.due)}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => onEdit(item)} className="text-gray-400 hover:text-blue-500 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
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
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PlanningPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'lista'

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('A Fazer');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, uRes] = await Promise.all([
        api.get('/plannings'),
        api.get('/identity/users').catch(() => ({ data: [] })),
      ]);
      setItems(pRes.data || []);
      setUsers(uRes.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived counts ──────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const all = items.length;
    const concluido = items.filter((i) => i.status === 'Concluído').length;
    const emProgresso = items.filter((i) => i.status === 'Em Progresso').length;
    const atrasado = items.filter((i) => i.due && new Date(i.due) < new Date() && i.status !== 'Concluído').length;
    return { all, concluido, emProgresso, atrasado };
  }, [items]);

  // ── Filtered items ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && i.status !== filterStatus) return false;
      if (filterPriority && i.priority !== filterPriority) return false;
      return true;
    });
  }, [items, search, filterStatus, filterPriority]);

  const byStatus = useMemo(() => {
    const map = {};
    STATUSES.forEach((s) => { map[s] = []; });
    filtered.forEach((i) => { if (map[i.status]) map[i.status].push(i); });
    return map;
  }, [filtered]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleMove = async (id, newStatus) => {
    try {
      const res = await api.patch(`/plannings/${id}/move`, { status: newStatus });
      setItems((prev) => prev.map((i) => (i.id === id ? res.data : i)));
    } catch { /* silent */ }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este planejamento?')) return;
    try {
      await api.delete(`/plannings/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { /* silent */ }
  };

  const openNew = (status = 'A Fazer') => {
    setEditItem(null);
    setDefaultStatus(status);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const handleSaved = (saved) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Carregando planejamentos...
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-erplus-text">Meus Planejamentos</h1>
          <p className="text-sm text-erplus-text-muted mt-0.5">Organize suas atividades em colunas</p>
        </div>
        <button
          onClick={() => openNew()}
          className="flex items-center gap-2 bg-erplus-accent hover:bg-erplus-accent/90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={16} />
          Novo Planejamento
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-gray-300">
          <div className="text-2xl font-extrabold text-gray-700">{counts.all}</div>
          <div className="text-xs text-gray-400 mt-1">Total</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-400">
          <div className="text-2xl font-extrabold text-blue-600">{counts.emProgresso}</div>
          <div className="text-xs text-gray-400 mt-1">Em Progresso</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-400">
          <div className="text-2xl font-extrabold text-red-500">{counts.atrasado}</div>
          <div className="text-xs text-gray-400 mt-1">Atrasados</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-400">
          <div className="text-2xl font-extrabold text-green-600">{counts.concluido}</div>
          <div className="text-xs text-gray-400 mt-1">Concluídos</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-erplus-accent/30 bg-white"
            placeholder="Buscar planejamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <div className="w-44">
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            options={[{ value: '', label: 'Todos os status' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
            placeholder="Todos os status"
          />
        </div>

        {/* Priority filter */}
        <div className="w-40">
          <Select
            value={filterPriority}
            onChange={setFilterPriority}
            options={[{ value: '', label: 'Todas prioridades' }, ...PRIORITIES.map((p) => ({ value: p, label: p }))]}
            placeholder="Todas prioridades"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 ml-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'kanban' ? 'bg-white shadow text-erplus-accent' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid size={13} /> Kanban
          </button>
          <button
            onClick={() => setViewMode('lista')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'lista' ? 'bg-white shadow text-erplus-accent' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={13} /> Lista
          </button>
        </div>
      </div>

      {/* Kanban board */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <KanbanCol
              key={status}
              status={status}
              items={byStatus[status] || []}
              onAdd={openNew}
              onMove={handleMove}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <ListView
          items={filtered}
          onEdit={openEdit}
          onDelete={handleDelete}
          onMove={handleMove}
        />
      )}

      {/* Modal */}
      <PlanningModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        initial={editItem || null}
        defaultStatus={defaultStatus}
        users={users.length > 0 ? users : (user ? [{ id: user.id, name: user.name || user.email }] : [])}
      />
    </div>
  );
}
