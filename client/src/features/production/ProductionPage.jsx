import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Save, Trash2, Edit, Clock, Search, LayoutGrid, List } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';
import { fmtDate } from '../../utils/date';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';

// ─── Constants ───────────────────────────────────────────────────────────────
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

const STATUS_STYLE = {
  'Não iniciado': { dot: 'bg-gray-400',  badge: 'bg-gray-100 text-gray-600',   header: 'border-gray-300'  },
  'Em andamento': { dot: 'bg-blue-500',  badge: 'bg-blue-100 text-blue-700',   header: 'border-blue-400'  },
  'Em revisão':   { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', header: 'border-amber-400' },
  'Finalizado':   { dot: 'bg-green-500', badge: 'bg-green-100 text-green-700', header: 'border-green-400' },
};

// ─── ItemModal ────────────────────────────────────────────────────────────────
function ItemModal({ item, activeCategory, onClose, onSaved }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    title: item?.title || '',
    description: item?.description || '',
    status: item?.status || 'Não iniciado',
    responsibleId: item?.responsibleId || 1,
    due: item?.due?.slice(0, 10) || '',
    category: item?.category || activeCategory,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, responsibleId: Number(form.responsibleId), due: form.due || null };
      if (isEdit) await api.put(`/production/items/${item.id}`, payload);
      else        await api.post('/production/items', payload);
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">{isEdit ? 'Editar Item' : 'Novo Item de Produção'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Título *</label>
            <input
              value={form.title}
              onChange={(e) => set('title')(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/30"
              placeholder="Nome do item"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-erplus-accent/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Categoria</label>
              <Select
                value={form.category}
                onChange={set('category')}
                options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Prazo</label>
              <DatePicker value={form.due} onChange={set('due')} placeholder="Selecionar data" />
            </div>
          </div>
          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
              <Select value={form.status} onChange={set('status')} options={STATUSES} />
            </div>
          )}
        </div>
        {error && <div className="mx-6 mb-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 hover:bg-erplus-accent/90 transition-colors"
          >
            <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KanbanCard ───────────────────────────────────────────────────────────────
function KanbanCard({ item, onStatusChange, onEdit, onDelete, clientName, dealTitle }) {
  const st = STATUS_STYLE[item.status] || STATUS_STYLE['Não iniciado'];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow group">
      {/* Type badge */}
      {item.prodItemTypeName && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 mb-2 inline-block">
          {item.prodItemTypeName}
        </span>
      )}

      {/* Title */}
      <p className="text-sm font-semibold text-gray-800 leading-snug mb-1">{item.title}</p>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</p>
      )}

      {/* Client / Deal */}
      {(clientName || dealTitle) && (
        <div className="text-xs text-blue-600 font-medium mb-2 truncate">
          {clientName || dealTitle}
        </div>
      )}

      {/* Due */}
      {item.due && (
        <div className={`flex items-center gap-1 text-xs mb-3 ${item.isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
          <Clock size={11} />
          {fmtDate(item.due)}
          {item.isOverdue && <span className="ml-1 text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">Atrasado</span>}
        </div>
      )}

      {/* Footer: status change + actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
        <Select
          value={item.status}
          onChange={(v) => onStatusChange(item.id, v)}
          options={STATUSES}
          size="sm"
        />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(item)} className="p-1 text-gray-400 hover:text-blue-500 transition-colors"><Edit size={13} /></button>
          <button onClick={() => onDelete(item.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── KanbanCol ────────────────────────────────────────────────────────────────
function KanbanCol({ status, items, onStatusChange, onEdit, onDelete, onAdd, clientMap, dealMap }) {
  const st = STATUS_STYLE[status];
  return (
    <div className="flex flex-col min-w-[250px] max-w-[290px] flex-1">
      <div className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${st.header}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
          <span className="text-sm font-bold text-gray-700">{status}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.badge}`}>{items.length}</span>
        </div>
        <button onClick={() => onAdd(status)} className="p-1 text-gray-400 hover:text-erplus-accent transition-colors rounded-lg hover:bg-gray-100">
          <Plus size={15} />
        </button>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {items.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-gray-300">Nenhum item</p>
          </div>
        )}
        {items.map((item) => (
          <KanbanCard
            key={item.id}
            item={item}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
            clientName={item.clientId ? clientMap[item.clientId] : null}
            dealTitle={item.dealId ? dealMap[item.dealId] : null}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductionPage({ mine = false }) {
  const { user } = useAuthStore();
  const [items, setItems]           = useState([]);
  const [summary, setSummary]       = useState([]);
  const [activeCategory, setActiveCategory] = useState('licenciamentos');
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null); // null | 'new' | item object

  // External data for filter labels
  const [contacts, setContacts]     = useState([]);
  const [deals, setDeals]           = useState([]);
  const [users, setUsers]           = useState([]);

  // View + filters
  const [viewMode, setViewMode]     = useState('kanban'); // 'kanban' | 'lista'
  const [search, setSearch]         = useState('');
  const [filterResponsible, setFilterResponsible] = useState('');
  const [filterStatus, setFilterStatus]           = useState('');
  const [filterVinculo, setFilterVinculo]         = useState(''); // dealId
  const [filterClient, setFilterClient]           = useState(''); // clientId

  // Load contacts/deals/users once
  useEffect(() => {
    Promise.all([
      api.get('/crm/contacts').catch(() => ({ data: [] })),
      api.get('/commercial/deals').catch(() => ({ data: [] })),
      api.get('/identity/users').catch(() => ({ data: [] })),
    ]).then(([cRes, dRes, uRes]) => {
      setContacts(cRes.data || []);
      setDeals(dRes.data || []);
      setUsers(uRes.data || []);
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const userFilter = mine && user?.id ? `&responsibleId=${user.id}` : '';
      const [iRes, sRes] = await Promise.all([
        api.get(`/production/items?category=${activeCategory}${userFilter}`),
        api.get('/production/summary'),
      ]);
      setItems(iRes.data || []);
      setSummary(sRes.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [activeCategory, mine, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Lookup maps
  const clientMap = useMemo(() => {
    const m = {};
    contacts.forEach((c) => { m[c.id] = c.name || c.nome || `#${c.id}`; });
    return m;
  }, [contacts]);

  const dealMap = useMemo(() => {
    const m = {};
    deals.forEach((d) => { m[d.id] = d.title || d.titulo || `#${d.id}`; });
    return m;
  }, [deals]);

  const userMap = useMemo(() => {
    const m = {};
    users.forEach((u) => { m[u.id] = u.name || u.nome || u.email || `#${u.id}`; });
    return m;
  }, [users]);

  // Derived filter options from loaded items
  const responsibleOptions = useMemo(() => {
    const ids = [...new Set(items.map((i) => i.responsibleId).filter(Boolean))];
    return [
      { value: '', label: 'Todos responsáveis' },
      ...ids.map((id) => ({ value: String(id), label: userMap[id] || `#${id}` })),
    ];
  }, [items, userMap]);

  const vinculoOptions = useMemo(() => {
    const ids = [...new Set(items.map((i) => i.dealId).filter(Boolean))];
    return [
      { value: '', label: 'Todos vínculos' },
      ...ids.map((id) => ({ value: String(id), label: dealMap[id] || `Negócio #${id}` })),
    ];
  }, [items, dealMap]);

  const clientOptions = useMemo(() => {
    const ids = [...new Set(items.map((i) => i.clientId).filter(Boolean))];
    return [
      { value: '', label: 'Todos os clientes' },
      ...ids.map((id) => ({ value: String(id), label: clientMap[id] || `Cliente #${id}` })),
    ];
  }, [items, clientMap]);

  const statusOptions = useMemo(() => [
    { value: '', label: 'Todos status' },
    ...STATUSES.map((s) => ({ value: s, label: s })),
  ], []);

  // Filtered items
  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterResponsible && String(i.responsibleId) !== filterResponsible) return false;
      if (filterStatus && i.status !== filterStatus) return false;
      if (filterVinculo && String(i.dealId) !== filterVinculo) return false;
      if (filterClient && String(i.clientId) !== filterClient) return false;
      return true;
    });
  }, [items, search, filterResponsible, filterStatus, filterVinculo, filterClient]);

  const byStatus = useMemo(() => {
    const map = {};
    STATUSES.forEach((s) => { map[s] = []; });
    filtered.forEach((i) => { if (map[i.status]) map[i.status].push(i); });
    return map;
  }, [filtered]);

  // Handlers
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

  const activeCat = CATEGORIES.find((c) => c.key === activeCategory);
  const catLabel  = activeCat?.label?.toLowerCase() || 'item';

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-erplus-text">Produção</h1>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-erplus-accent/90 transition-colors shadow-sm"
        >
          <Plus size={16} /> Novo Item
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 bg-gray-100 rounded-xl p-1">
        {CATEGORIES.map((cat) => {
          const s = summary.find((x) => x.category === cat.key);
          return (
            <button
              key={cat.key}
              onClick={() => {
                setActiveCategory(cat.key);
                setSearch('');
                setFilterResponsible('');
                setFilterStatus('');
                setFilterVinculo('');
                setFilterClient('');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.key
                  ? 'bg-white shadow-sm text-gray-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
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
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-erplus-accent/30 bg-white"
            placeholder={`Pesquisar ${catLabel}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Kanban / Lista toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'kanban'
                ? 'bg-white shadow text-erplus-accent'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid size={13} /> Kanban
          </button>
          <button
            onClick={() => setViewMode('lista')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'lista'
                ? 'bg-white shadow text-erplus-accent'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={13} /> Lista
          </button>
        </div>

        {/* Todos responsáveis */}
        <div className="w-44">
          <Select
            value={filterResponsible}
            onChange={setFilterResponsible}
            options={responsibleOptions}
            placeholder="Todos responsáveis"
          />
        </div>

        {/* Todos status */}
        <div className="w-40">
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            options={statusOptions}
            placeholder="Todos status"
          />
        </div>

        {/* Todos vínculos */}
        <div className="w-44">
          <Select
            value={filterVinculo}
            onChange={setFilterVinculo}
            options={vinculoOptions}
            placeholder="Todos vínculos"
          />
        </div>

        {/* Todos os clientes */}
        <div className="w-44">
          <Select
            value={filterClient}
            onChange={setFilterClient}
            options={clientOptions}
            placeholder="Todos os clientes"
          />
        </div>

        {/* Count */}
        <span className="ml-auto text-xs text-gray-400 whitespace-nowrap font-medium">
          {filtered.length} {catLabel}(s)
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : viewMode === 'kanban' ? (
        /* ── KANBAN ── */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <KanbanCol
              key={status}
              status={status}
              items={byStatus[status] || []}
              onStatusChange={handleStatusChange}
              onEdit={setModal}
              onDelete={handleDelete}
              onAdd={() => setModal('new')}
              clientMap={clientMap}
              dealMap={dealMap}
            />
          ))}
        </div>
      ) : (
        /* ── LISTA ── */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Item</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Vínculo</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Prazo</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-300 text-sm">
                    Nenhum item em {activeCat?.label}
                  </td>
                </tr>
              ) : filtered.map((item) => {
                const st = STATUS_STYLE[item.status] || STATUS_STYLE['Não iniciado'];
                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="text-sm font-semibold text-gray-800">{item.title}</div>
                      {item.description && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{item.description}</div>}
                      {item.prodItemTypeName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-semibold mt-1 inline-block">
                          {item.prodItemTypeName}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {item.clientId ? (clientMap[item.clientId] || `#${item.clientId}`) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-sm text-blue-600">
                      {item.dealId ? (dealMap[item.dealId] || `Negócio #${item.dealId}`) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {item.due ? (
                        <span className={`text-sm flex items-center gap-1 ${item.isOverdue ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
                          <Clock size={12} />{fmtDate(item.due)}
                        </span>
                      ) : <span className="text-gray-300 text-sm">—</span>}
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
                        <button onClick={() => setModal(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
