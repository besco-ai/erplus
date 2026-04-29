import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Save, Trash2, Edit, Clock, Search, LayoutGrid, List, Kanban } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';
import { fmtDate } from '../../utils/date';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';

const CATEGORIES = [
  { key: 'licenciamentos',  label: 'Licenciamentos',    color: '#F59E0B' },
  { key: 'design',          label: 'Design Criativo',   color: '#EC4899' },
  { key: 'projetos',        label: 'Projetos',          color: '#7C3AED' },
  { key: 'revisao_tecnica', label: 'Revisões Técnicas', color: '#8B5CF6' },
  { key: 'incorporacoes',   label: 'Incorporações',     color: '#3B82F6' },
  { key: 'supervisao',      label: 'Supervisões',       color: '#06B6D4' },
  { key: 'vistorias',       label: 'Vistorias',         color: '#10B981' },
  { key: 'averbacoes',      label: 'Averbações',        color: '#F97316' },
];

const STATUSES = ['Não iniciado', 'Em andamento', 'Em revisão', 'Finalizado'];

const STATUS_STYLES = {
  'Não iniciado': { header: 'bg-gray-100 border-gray-200',   badge: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400'  },
  'Em andamento': { header: 'bg-blue-50 border-blue-100',    badge: 'bg-blue-100 text-blue-600',   dot: 'bg-blue-500'  },
  'Em revisão':   { header: 'bg-amber-50 border-amber-100',  badge: 'bg-amber-100 text-amber-600', dot: 'bg-amber-400' },
  'Finalizado':   { header: 'bg-green-50 border-green-100',  badge: 'bg-green-100 text-green-600', dot: 'bg-green-500' },
};

/* ── Item Modal ─────────────────────────────────────────────────────────────── */
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
      else        await api.post('/production/items', payload);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
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
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Categoria</label>
              <Select value={form.category} onChange={(v) => setForm({ ...form, category: v })}
                options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prazo</label>
              <DatePicker value={form.due} onChange={(v) => setForm({ ...form, due: v })} />
            </div>
          </div>
          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
              <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES} />
            </div>
          )}
        </div>
        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 flex items-center gap-2">
            <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Kanban Card ────────────────────────────────────────────────────────────── */
function KanbanCard({ item, onStatusChange, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 mb-2 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div className="text-sm font-semibold text-gray-900 leading-snug flex-1">{item.title}</div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(item)} className="p-1 text-gray-300 hover:text-blue-500 rounded"><Edit size={12} /></button>
          <button onClick={() => onDelete(item.id)} className="p-1 text-gray-300 hover:text-red-500 rounded"><Trash2 size={12} /></button>
        </div>
      </div>
      {item.description && <div className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</div>}
      {item.prodItemTypeName && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">{item.prodItemTypeName}</span>
      )}
      {item.due && (
        <div className={`flex items-center gap-1 text-xs mt-1.5 ${item.isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
          <Clock size={10} />{fmtDate(item.due)}
        </div>
      )}
      <div className="mt-2">
        <Select value={item.status} onChange={(v) => onStatusChange(item.id, v)} options={STATUSES} size="sm" />
      </div>
    </div>
  );
}

/* ── Kanban Column ──────────────────────────────────────────────────────────── */
function KanbanColumn({ status, items, onStatusChange, onEdit, onDelete }) {
  const [dragOver, setDragOver] = useState(false);
  const st = STATUS_STYLES[status] || STATUS_STYLES['Não iniciado'];
  return (
    <div
      className={`flex-shrink-0 w-64 flex flex-col rounded-xl border transition ${dragOver ? 'border-erplus-accent/40 bg-erplus-accent/5' : 'bg-gray-50/60 border-gray-100'}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
    >
      <div className={`px-3 py-2.5 rounded-t-xl border-b ${st.header}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${st.dot}`} />
            <span className="text-xs font-bold text-gray-700">{status}</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.badge}`}>{items.length}</span>
        </div>
      </div>
      <div className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-360px)]">
        {items.map((item) => (
          <KanbanCard key={item.id} item={item} onStatusChange={onStatusChange} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {items.length === 0 && <div className="text-center py-8 text-xs text-gray-300">Nenhum item</div>}
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function ProductionPage({ mine = false }) {
  const { user }         = useAuthStore();
  const [items, setItems]           = useState([]);
  const [summary, setSummary]       = useState([]);
  const [users, setUsers]           = useState([]);
  const [activeCategory, setActiveCategory] = useState('licenciamentos');
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [view, setView]             = useState('kanban');
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus]           = useState('');
  const [filterResponsible, setFilterResponsible] = useState('');

  // Load users once for responsible filter labels
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/identity/users');
        const data = r.data;
        const arr = Array.isArray(data) ? data : (data?.items ?? []);
        setUsers(arr);
      } catch { /* silent */ }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const userFilter = mine && user?.id ? `&responsibleId=${user.id}` : '';
      const [iRes, sRes] = await Promise.all([
        api.get(`/production/items?category=${activeCategory}${userFilter}`),
        api.get('/production/summary'),
      ]);
      setItems(Array.isArray(iRes.data) ? iRes.data : []);
      setSummary(Array.isArray(sRes.data) ? sRes.data : []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [activeCategory, mine, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/production/items/${id}`, { status: newStatus });
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus } : i));
    } catch { /* silent */ }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este item?')) return;
    try {
      await api.delete(`/production/items/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { /* silent */ }
  };

  // Responsible options derived from loaded items + users list
  const responsibleOptions = useMemo(() => {
    const ids = [...new Set(items.map((i) => i.responsibleId).filter(Boolean))];
    const userMap = {};
    users.forEach((u) => { userMap[u.id] = u.name || u.nome || u.email || `#${u.id}`; });
    return [
      { value: '', label: 'Todos responsáveis' },
      ...ids.map((id) => ({ value: String(id), label: userMap[id] || `#${id}` })),
    ];
  }, [items, users]);

  const statusOptions = useMemo(() => [
    { value: '', label: 'Todos status' },
    ...STATUSES.map((s) => ({ value: s, label: s })),
  ], []);

  // Apply filters
  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (search && !i.title?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && i.status !== filterStatus) return false;
      if (filterResponsible && String(i.responsibleId) !== filterResponsible) return false;
      return true;
    });
  }, [items, search, filterStatus, filterResponsible]);

  const byStatus = useMemo(() => {
    const map = {};
    STATUSES.forEach((s) => { map[s] = []; });
    filtered.forEach((i) => { if (map[i.status]) map[i.status].push(i); });
    return map;
  }, [filtered]);

  const activeCat  = CATEGORIES.find((c) => c.key === activeCategory);
  const catLabel   = activeCat?.label?.toLowerCase() || 'item';
  const hasFilters = search || filterStatus || filterResponsible;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-erplus-text">
          {mine ? 'Minha Produção' : 'Produção'}
        </h1>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-erplus-accent/90 transition-colors shadow-sm">
          <Plus size={16} /> Novo Item
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 bg-gray-100 rounded-xl p-1">
        {CATEGORIES.map((cat) => {
          const s = summary.find((x) => x.category === cat.key);
          return (
            <button key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setSearch(''); setFilterStatus(''); setFilterResponsible(''); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.key ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              {cat.label}
              {s && s.total > 0 && <span className="text-xs text-gray-400">({s.total})</span>}
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[190px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Pesquisar ${catLabel}...`}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-erplus-accent/30 bg-white"
          />
        </div>

        {/* Kanban / Lista toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'kanban' ? 'bg-erplus-accent text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <LayoutGrid size={13} /> Kanban
          </button>
          <button onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'list' ? 'bg-erplus-accent text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <List size={13} /> Lista
          </button>
        </div>

        {/* Todos responsáveis */}
        <div className="w-44">
          <Select value={filterResponsible} onChange={setFilterResponsible} options={responsibleOptions} placeholder="Todos responsáveis" />
        </div>

        {/* Todos status */}
        <div className="w-40">
          <Select value={filterStatus} onChange={setFilterStatus} options={statusOptions} placeholder="Todos status" />
        </div>

        {/* Count + clear */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {filtered.length} {catLabel}(s)
          </span>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterResponsible(''); }}
              className="text-xs text-erplus-accent hover:underline whitespace-nowrap">
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              items={byStatus[status] || []}
              onStatusChange={handleStatusChange}
              onEdit={setModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
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
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-gray-300 text-sm">
                  {hasFilters ? 'Nenhum item corresponde aos filtros' : `Nenhum item em ${activeCat?.label}`}
                </td></tr>
              ) : filtered.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="text-sm font-semibold">{item.title}</div>
                    {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                    {item.prodItemTypeName && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold mt-1 inline-block">
                        {item.prodItemTypeName}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {item.due ? (
                      <span className={`text-sm flex items-center gap-1 ${item.isOverdue ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
                        <Clock size={12} />{fmtDate(item.due)}
                      </span>
                    ) : <span className="text-gray-300 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <Select value={item.status} onChange={(v) => handleStatusChange(item.id, v)} options={STATUSES} size="sm" />
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

      {modal && (
        <ItemModal
          item={modal === 'new' ? null : modal}
          activeCategory={activeCategory}
          onClose={() => setModal(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
