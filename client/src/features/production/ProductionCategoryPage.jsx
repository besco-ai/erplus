import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Save, Trash2, Edit, Clock, LayoutList, LayoutGrid, Search } from 'lucide-react';
import api from '../../services/api';
import { fmtDate } from '../../utils/date';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';

/* ── Singular labels por categoria ─────────────────────────────────────── */
const SINGULAR = {
  licenciamentos:  'Licenciamento',
  design:          'Design Criativo',
  projetos:        'Projeto',
  revisao_tecnica: 'Revisão Técnica',
  incorporacoes:   'Incorporação',
  supervisao:      'Supervisão',
  vistorias:       'Vistoria',
  averbacoes:      'Averbação',
};

const STATUSES = ['Não iniciado', 'Em andamento', 'Em revisão', 'Finalizado'];

const STATUS_STYLES = {
  'Não iniciado': { header: 'bg-gray-100 border-gray-200',   badge: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400'  },
  'Em andamento': { header: 'bg-blue-50 border-blue-100',    badge: 'bg-blue-100 text-blue-600',   dot: 'bg-blue-500'  },
  'Em revisão':   { header: 'bg-amber-50 border-amber-100',  badge: 'bg-amber-100 text-amber-600', dot: 'bg-amber-400' },
  'Finalizado':   { header: 'bg-green-50 border-green-100',  badge: 'bg-green-100 text-green-600', dot: 'bg-green-500' },
};

/* ── Item Modal ─────────────────────────────────────────────────────────── */
function ItemModal({ item, category, singular, users, deals, onClose, onSaved }) {
  const isEdit = !!item;

  const [form, setForm] = useState({
    title:         item?.title        || '',
    description:   item?.description  || '',
    status:        item?.status       || 'Não iniciado',
    responsibleId: item?.responsibleId|| '',
    due:           item?.due?.slice(0, 10) || '',
    dealId:        item?.dealId       || '',
    category,
  });

  // Subtarefas — cada item: { title, due, responsibleId }
  const initSubs = useMemo(() => {
    try {
      const parsed = item?.subtasksJson ? JSON.parse(item.subtasksJson) : [];
      // suporte a versão antiga (array de strings)
      return parsed.map((s) => typeof s === 'string' ? { title: s, due: '', responsibleId: '' } : s);
    } catch { return []; }
  }, [item]);
  const [subtasks, setSubtasks] = useState(initSubs);
  const [subForm,  setSubForm]  = useState({ title: '', due: '', responsibleId: '' });

  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setSub = (k) => (v) => setSubForm((f) => ({ ...f, [k]: v }));

  const addSubtask = () => {
    const t = subForm.title.trim();
    if (!t) return;
    setSubtasks((prev) => [...prev, { title: t, due: subForm.due, responsibleId: subForm.responsibleId }]);
    setSubForm({ title: '', due: '', responsibleId: '' });
  };

  const removeSubtask = (i) => setSubtasks((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Título obrigatório.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        title:         form.title.trim(),
        description:   form.description || null,
        category:      form.category,
        status:        form.status,
        responsibleId: Number(form.responsibleId) || 1,
        due:           form.due || null,
        dealId:        form.dealId ? Number(form.dealId) : null,
        subtasksJson:  subtasks.length ? JSON.stringify(subtasks) : null,
      };
      if (isEdit) await api.put(`/production/items/${item.id}`, payload);
      else        await api.post('/production/items', payload);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  const userOptions = users.map((u) => ({ value: u.id, label: u.name || u.nome || u.email || `#${u.id}` }));
  const dealOptions = [
    { value: '', label: '— Nenhum —' },
    ...deals.map((d) => ({ value: d.id, label: d.title || d.titulo || `#${d.id}` })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">
            {isEdit ? `Editar ${singular}` : `Novo ${singular}`}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input
              value={form.title}
              onChange={(e) => set('title')(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/30"
              placeholder={`Nome do ${singular.toLowerCase()}`}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-erplus-accent/30"
            />
          </div>

          {/* Responsável + Prazo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Responsável</label>
              <Select
                value={form.responsibleId}
                onChange={(v) => set('responsibleId')(Number(v))}
                options={userOptions}
                placeholder="Selecionar..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prazo</label>
              <DatePicker
                value={form.due}
                onChange={set('due')}
                placeholder="Selecionar data"
              />
            </div>
          </div>

          {/* Vincular a */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vincular a</label>
            <Select
              value={form.dealId}
              onChange={set('dealId')}
              options={dealOptions}
              placeholder="— Nenhum —"
            />
          </div>

          {/* Status — só na edição */}
          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
              <Select value={form.status} onChange={set('status')} options={STATUSES} />
            </div>
          )}

          {/* Subtarefas */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Subtarefas</label>

            {/* Lista de subtarefas adicionadas */}
            {subtasks.length > 0 && (
              <ul className="mb-3 space-y-1.5">
                {subtasks.map((s, i) => {
                  const respName = users.find((u) => String(u.id) === String(s.responsibleId))?.name
                    || users.find((u) => String(u.id) === String(s.responsibleId))?.nome
                    || null;
                  return (
                    <li key={i} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm">
                      {/* Número */}
                      <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-erplus-accent/10 text-erplus-accent text-[10px] font-bold">
                        {i + 1}
                      </span>
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{s.title}</div>
                        {(s.due || respName) && (
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {respName && (
                              <span className="text-[11px] text-gray-400 truncate max-w-[120px]">{respName}</span>
                            )}
                            {s.due && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Clock size={10} />{fmtDate(s.due)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeSubtask(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 p-0.5">
                        <X size={13} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Mini-form nova subtarefa */}
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40 p-3 space-y-2">
              {/* Linha 1 — Título */}
              <input
                value={subForm.title}
                onChange={(e) => setSub('title')(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                placeholder="Título da subtarefa..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-erplus-accent/30"
              />
              {/* Linha 2 — Responsável | Prazo | Botão (mesma altura py-2.5) */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={subForm.responsibleId}
                    onChange={setSub('responsibleId')}
                    options={[{ value: '', label: 'Responsável...' }, ...userOptions]}
                    placeholder="Responsável..."
                  />
                </div>
                <div className="flex-1">
                  <DatePicker
                    value={subForm.due}
                    onChange={setSub('due')}
                    placeholder="Prazo"
                  />
                </div>
                <button
                  onClick={addSubtask}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-erplus-accent text-white text-sm font-semibold rounded-lg hover:bg-erplus-accent/90 transition-colors whitespace-nowrap"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="mx-6 mb-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            Cancelar
          </button>
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

/* ── Kanban Card ────────────────────────────────────────────────────────── */
function KanbanCard({ item, onEdit, onDelete }) {
  const subtasks = useMemo(() => {
    try {
      const parsed = item.subtasksJson ? JSON.parse(item.subtasksJson) : [];
      return parsed.map((s) => typeof s === 'string' ? { title: s, due: '', responsibleId: '' } : s);
    } catch { return []; }
  }, [item.subtasksJson]);

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('itemId', item.id.toString())}
      className="bg-white rounded-xl border border-gray-100 p-3 mb-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div className="text-sm font-semibold text-gray-900 leading-snug flex-1">{item.title}</div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-1 text-gray-300 hover:text-blue-500 rounded"><Edit size={12} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-1 text-gray-300 hover:text-red-500 rounded"><Trash2 size={12} /></button>
        </div>
      </div>
      {item.description && <div className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</div>}
      {item.prodItemTypeName && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">{item.prodItemTypeName}</span>
      )}
      {subtasks.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
          <span className="bg-gray-100 rounded px-1.5 py-0.5">{subtasks.length} subtarefa{subtasks.length > 1 ? 's' : ''}</span>
        </div>
      )}
      {item.due && (
        <div className={`flex items-center gap-1 text-xs mt-1.5 ${item.isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
          <Clock size={10} />{fmtDate(item.due)}
        </div>
      )}
    </div>
  );
}

/* ── Kanban Column ──────────────────────────────────────────────────────── */
function KanbanColumn({ status, items, onStatusDrop, onEdit, onDelete }) {
  const [dragOver, setDragOver] = useState(false);
  const st = STATUS_STYLES[status] || STATUS_STYLES['Não iniciado'];

  return (
    <div
      className={`flex-shrink-0 w-64 flex flex-col rounded-xl border transition ${dragOver ? st.header + ' border-opacity-60' : 'bg-gray-50/60 border-gray-100'}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const id = e.dataTransfer.getData('itemId'); if (id) onStatusDrop(Number(id), status); }}
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
      <div className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-320px)]">
        {items.map((item) => (
          <KanbanCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {items.length === 0 && <div className="text-center py-8 text-xs text-gray-300">Arraste um card aqui</div>}
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function ProductionCategoryPage({ category, label, color }) {
  const singular = SINGULAR[category] || label?.replace(/s$/, '') || 'Item';

  const [items,   setItems]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [deals,   setDeals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | 'new' | item

  const [view,              setView]              = useState('kanban');
  const [search,            setSearch]            = useState('');
  const [filterStatus,      setFilterStatus]      = useState('');
  const [filterResponsible, setFilterResponsible] = useState('');
  const [filterVinculo,     setFilterVinculo]     = useState('');
  const [filterClient,      setFilterClient]      = useState('');

  // Load users + deals once
  useEffect(() => {
    const safe = (r) => { const d = r?.data; return Array.isArray(d) ? d : (d?.items ?? []); };
    Promise.allSettled([
      api.get('/identity/users'),
      api.get('/commercial/deals'),
    ]).then(([uR, dR]) => {
      if (uR.status === 'fulfilled') setUsers(safe(uR.value));
      if (dR.status === 'fulfilled') setDeals(safe(dR.value));
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/production/items?category=${category}`);
      setItems(Array.isArray(r.data) ? r.data : []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [category]);

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

  // Filter options from items
  const userMap = useMemo(() => {
    const m = {}; users.forEach((u) => { m[u.id] = u.name || u.nome || u.email || `#${u.id}`; }); return m;
  }, [users]);
  const dealMap = useMemo(() => {
    const m = {}; deals.forEach((d) => { m[d.id] = d.title || d.titulo || `#${d.id}`; }); return m;
  }, [deals]);

  const respOpts = useMemo(() => {
    const ids = [...new Set(items.map((i) => i.responsibleId).filter(Boolean))];
    return [{ value: '', label: 'Todos responsáveis' }, ...ids.map((id) => ({ value: String(id), label: userMap[id] || `#${id}` }))];
  }, [items, userMap]);

  const vinculoOpts = useMemo(() => {
    const ids = [...new Set(items.map((i) => i.dealId).filter(Boolean))];
    return [{ value: '', label: 'Todos vínculos' }, ...ids.map((id) => ({ value: String(id), label: dealMap[id] || `#${id}` }))];
  }, [items, dealMap]);

  const statusOpts = useMemo(() => [
    { value: '', label: 'Todos status' },
    ...STATUSES.map((s) => ({ value: s, label: s })),
  ], []);

  // Filtered items
  const filtered = useMemo(() => items.filter((i) => {
    if (search           && !i.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus     && i.status !== filterStatus)                              return false;
    if (filterResponsible&& String(i.responsibleId) !== filterResponsible)          return false;
    if (filterVinculo    && String(i.dealId)         !== filterVinculo)             return false;
    return true;
  }), [items, search, filterStatus, filterResponsible, filterVinculo]);

  const byStatus = useMemo(() => {
    const m = {}; STATUSES.forEach((s) => { m[s] = []; });
    filtered.forEach((i) => { if (m[i.status]) m[i.status].push(i); });
    return m;
  }, [filtered]);

  const hasFilters = search || filterStatus || filterResponsible || filterVinculo || filterClient;

  return (
    <div className="space-y-4">

      {/* ── Header row: title + button ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {color && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />}
          <h1 className="text-xl font-extrabold text-erplus-text">{label}</h1>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-erplus-accent/90 transition-colors shadow-sm"
        >
          <Plus size={16} /> Novo {singular}
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Pesquisar ${singular.toLowerCase()}...`}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20 bg-white"
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
            <LayoutList size={13} /> Lista
          </button>
        </div>

        {/* Todos responsáveis */}
        <div className="w-44">
          <Select value={filterResponsible} onChange={setFilterResponsible} options={respOpts} placeholder="Todos responsáveis" />
        </div>

        {/* Todos status */}
        <div className="w-40">
          <Select value={filterStatus} onChange={setFilterStatus} options={statusOpts} placeholder="Todos status" />
        </div>

        {/* Todos vínculos */}
        <div className="w-44">
          <Select value={filterVinculo} onChange={setFilterVinculo} options={vinculoOpts} placeholder="Todos vínculos" />
        </div>

        {/* Count + clear */}
        <span className="ml-auto text-sm text-gray-500 whitespace-nowrap">
          {filtered.length} {label?.toLowerCase()}(s)
        </span>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterResponsible(''); setFilterVinculo(''); setFilterClient(''); }}
            className="text-xs text-erplus-accent hover:underline whitespace-nowrap"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              items={byStatus[status] || []}
              onStatusDrop={handleStatusChange}
              onEdit={(item) => setModal(item)}
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
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">
                  {hasFilters ? 'Nenhum item corresponde aos filtros' : `Nenhum item em ${label}`}
                </td></tr>
              ) : filtered.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="text-sm font-semibold">{item.title}</div>
                    {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                    {item.prodItemTypeName && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">{item.prodItemTypeName}</span>
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
          category={category}
          singular={singular}
          users={users}
          deals={deals}
          onClose={() => setModal(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
