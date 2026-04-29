import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, X, Save, Edit, Trash2, MapPin, Search,
  LayoutGrid, GripVertical, ChevronRight, DollarSign,
} from 'lucide-react';
import api from '../../services/api';
import { fmtDate } from '../../utils/date';
import Select from '../../components/ui/Select';
import DatePicker from '../../components/ui/DatePicker';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const R$ = (v) =>
  'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const fmtInsc = (v) => {
  if (!v) return '';
  const d = String(v).replace(/\D/g, '').slice(0, 10);
  return [d.slice(0,2), d.slice(2,4), d.slice(4,6), d.slice(6,8), d.slice(8,10)]
    .filter(Boolean).join('-');
};

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const AVATAR_COLORS = [
  'bg-red-500','bg-blue-500','bg-green-500','bg-purple-500',
  'bg-amber-500','bg-pink-500','bg-cyan-500','bg-indigo-500',
];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

/* ── Novo Empreendimento Modal ───────────────────────────────────────────── */
function NewProjectModal({ pipelines, clients, users, businessTypes, onClose, onSaved }) {
  const firstPipeline = pipelines[0];
  const firstStage    = firstPipeline?.stages?.[0];

  const [form, setForm] = useState({
    title: '', clientId: '', dealId: null, value: '',
    pipelineId: firstPipeline?.id || '',
    stageId:    firstStage?.id    || '',
    responsibleId: '',
    startDate: '', endDate: '',
    registro: '', inscricaoImob: '', endEmpreendimento: '',
    businessTypeId: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  // Atualiza stageId ao mudar pipeline
  const handlePipelineChange = (pid) => {
    const pl = pipelines.find((p) => String(p.id) === String(pid));
    setForm((f) => ({
      ...f,
      pipelineId: pid,
      stageId: pl?.stages?.[0]?.id || '',
    }));
  };

  const stageOptions = useMemo(() => {
    const pl = pipelines.find((p) => String(p.id) === String(form.pipelineId));
    return (pl?.stages || []).map((s) => ({ value: s.id, label: s.name }));
  }, [pipelines, form.pipelineId]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.clientId || !form.pipelineId || !form.stageId) {
      setError('Preencha Título, Cliente, Pipeline e Etapa.'); return;
    }
    setSaving(true); setError('');
    try {
      await api.post('/projects', {
        title:           form.title.trim(),
        clientId:        Number(form.clientId),
        dealId:          form.dealId ? Number(form.dealId) : null,
        value:           Number(String(form.value).replace(',', '.')) || 0,
        pipelineId:      Number(form.pipelineId),
        stageId:         Number(form.stageId),
        responsibleId:   Number(form.responsibleId) || 1,
        startDate:       form.startDate || null,
        endDate:         form.endDate   || null,
        registro:        form.registro  || null,
        inscricaoImob:   form.inscricaoImob || null,
        endEmpreendimento: form.endEmpreendimento || null,
        businessTypeId:  form.businessTypeId ? Number(form.businessTypeId) : null,
      });
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar empreendimento.');
    } finally { setSaving(false); }
  };

  const clientOptions    = clients.map((c) => ({ value: c.id, label: c.name || c.nome || `#${c.id}` }));
  const userOptions      = users.map((u)   => ({ value: u.id, label: u.name || u.nome || u.email || `#${u.id}` }));
  const pipelineOptions  = pipelines.map((p) => ({ value: p.id, label: p.name }));
  const btOptions        = [{ value: '', label: 'Nenhum' }, ...businessTypes.map((b) => ({ value: b.id, label: b.name }))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">Novo Empreendimento</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input value={form.title} onChange={(e) => set('title')(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/30"
              placeholder="Nome do empreendimento" />
          </div>

          {/* Cliente + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cliente *</label>
              <Select value={form.clientId} onChange={(v) => set('clientId')(Number(v))} options={clientOptions} placeholder="Selecionar..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Valor</label>
              <input value={form.value} onChange={(e) => set('value')(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/30"
                placeholder="0,00" />
            </div>
          </div>

          {/* Pipeline + Etapa */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pipeline *</label>
              <Select value={form.pipelineId} onChange={handlePipelineChange} options={pipelineOptions} placeholder="Selecionar..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Etapa *</label>
              <Select value={form.stageId} onChange={set('stageId')} options={stageOptions} placeholder="Selecionar..." />
            </div>
          </div>

          {/* Responsável + Tipo de Negócio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Responsável</label>
              <Select value={form.responsibleId} onChange={(v) => set('responsibleId')(Number(v))} options={userOptions} placeholder="Selecionar..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo</label>
              <Select value={form.businessTypeId} onChange={set('businessTypeId')} options={btOptions} placeholder="Nenhum" />
            </div>
          </div>

          {/* Data Início + Data Fim */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data Início</label>
              <DatePicker value={form.startDate} onChange={set('startDate')} placeholder="Selecionar data" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Previsão Término</label>
              <DatePicker value={form.endDate} onChange={set('endDate')} placeholder="Selecionar data" />
            </div>
          </div>

          {/* Inscrição Imobiliária + Endereço */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Inscrição Imobiliária</label>
            <input value={form.inscricaoImob} onChange={(e) => set('inscricaoImob')(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/30"
              placeholder="00-00-00-00-00" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Endereço</label>
            <input value={form.endEmpreendimento} onChange={(e) => set('endEmpreendimento')(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/30"
              placeholder="Rua, número - Bairro, Cidade/UF" />
          </div>
        </div>

        {error && <div className="mx-6 mb-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.title.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 hover:bg-erplus-accent/90 transition-colors">
            <Save size={14} />{saving ? 'Salvando...' : 'Criar Empreendimento'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Nova Etapa Modal ────────────────────────────────────────────────────── */
function NewStageModal({ pipelineId, onClose, onSaved }) {
  const [name, setName]   = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post(`/projects/pipelines/${pipelineId}/stages`, { name: name.trim(), order: 99 });
      onSaved(); onClose();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">Nova Etapa</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome da Etapa *</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/30"
            placeholder="Ex: Em análise, Em execução..." autoFocus />
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50">
            <Save size={14} />{saving ? 'Salvando...' : 'Criar Etapa'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Project Card (Kanban) ───────────────────────────────────────────────── */
function ProjectCard({ project, clientMap, userMap, btMap, onClick }) {
  const clientName = clientMap[project.clientId] || '';
  const btName     = project.businessTypeId ? btMap[project.businessTypeId] : null;
  const respName   = userMap[project.responsibleId] || '';

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('projectId', String(project.id))}
      onClick={() => onClick(project)}
      className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all mb-2 group"
    >
      {/* Title + avatar */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-900 leading-snug">{project.title}</div>
          {project.inscricaoImob && (
            <div className="text-xs text-gray-400 mt-0.5">{fmtInsc(project.inscricaoImob)}</div>
          )}
        </div>
        {respName && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${avatarColor(project.responsibleId)}`}>
            {initials(respName)}
          </div>
        )}
      </div>

      {/* Address */}
      {project.endEmpreendimento && (
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <MapPin size={10} className="flex-shrink-0" />
          <span className="truncate">{project.endEmpreendimento}</span>
        </div>
      )}

      {/* Business type pill */}
      {btName && (
        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 mb-2">
          {btName}
        </span>
      )}

      {/* Value */}
      <div className="text-sm font-bold text-erplus-accent">{R$(project.value)}</div>
    </div>
  );
}

/* ── Kanban Column ────────────────────────────────────────────────────────── */
function KanbanColumn({ stage, projects, clientMap, userMap, btMap, onProjectClick, onDrop }) {
  const [dragOver, setDragOver] = useState(false);
  const stageProjects = projects.filter((p) => p.stageId === stage.id);

  return (
    <div
      className={`flex-shrink-0 w-72 flex flex-col rounded-xl border transition ${
        dragOver ? 'border-erplus-accent/40 bg-erplus-accent/5' : 'bg-gray-50/80 border-gray-100'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragOver(false);
        const id = e.dataTransfer.getData('projectId');
        if (id) onDrop(Number(id), stage.id);
      }}
    >
      {/* Column header */}
      <div className="px-3 py-3 border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2">
            <GripVertical size={13} className="text-gray-300" />
            <span className="text-sm font-bold text-gray-700">{stage.name}</span>
            <span className="text-xs font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
              {stageProjects.length}
            </span>
          </div>
          <button className="p-1 text-gray-300 hover:text-erplus-accent transition-colors rounded">
            <Plus size={14} />
          </button>
        </div>
        {stage.totalValue > 0 && (
          <div className="text-xs font-semibold text-erplus-accent ml-6">{R$(stage.totalValue)}</div>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        {stageProjects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            clientMap={clientMap}
            userMap={userMap}
            btMap={btMap}
            onClick={onProjectClick}
          />
        ))}
        {stageProjects.length === 0 && (
          <div className="text-center py-10 text-xs text-gray-300">Nenhum item</div>
        )}
      </div>
    </div>
  );
}

/* ── Project Detail Modal ────────────────────────────────────────────────── */
function ProjectDetailModal({ project, clientMap, userMap, btMap, onClose, onSaved }) {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/projects/${project.id}`);
        setDetail(data); setForm(data);
      } catch { /* silent */ } finally { setLoading(false); }
    })();
  }, [project.id]);

  const handleSave = async () => {
    try {
      await api.put(`/projects/${project.id}`, {
        title: form.title, notes: form.notes,
        registro: form.registro, inscricaoImob: form.inscricaoImob,
        endEmpreendimento: form.endEmpreendimento,
        tipologiaTerreno: form.tipologiaTerreno, morfologiaTerreno: form.morfologiaTerreno,
        testada: form.testada, areaTerreno: form.areaTerreno,
      });
      setEditing(false); onSaved();
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    if (!confirm('Excluir este empreendimento?')) return;
    await api.delete(`/projects/${project.id}`);
    onSaved(); onClose();
  };

  const F = ({ label, field, editable = true }) => (
    <div>
      <span className="text-xs text-gray-400 uppercase font-semibold">{label}</span>
      {editing && editable
        ? <input value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/30" />
        : <div className="text-sm font-medium mt-0.5 text-gray-700">{detail?.[field] || '—'}</div>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold">{detail?.title || project.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-bold text-erplus-accent">{R$(project.value)}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">{project.stageName}</span>
              {project.businessTypeId && btMap[project.businessTypeId] && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-600">
                  {btMap[project.businessTypeId]}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing
              ? <button onClick={() => setEditing(true)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
              : <button onClick={handleSave} className="px-3 py-1.5 bg-erplus-accent text-white rounded-lg text-xs font-semibold flex items-center gap-1"><Save size={12} /> Salvar</button>}
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
        </div>
        {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
          <div className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <F label="Registro"              field="registro" />
              <F label="Inscrição Imobiliária" field="inscricaoImob" />
              <div className="col-span-2"><F label="Endereço" field="endEmpreendimento" /></div>
              <F label="Início"           field="startDate" editable={false} />
              <F label="Previsão Término" field="endDate"   editable={false} />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              <F label="Tipologia do Terreno"  field="tipologiaTerreno" />
              <F label="Morfologia do Terreno" field="morfologiaTerreno" />
              <F label="Testada (m)"           field="testada" />
              <F label="Área (m²)"             field="areaTerreno" />
            </div>
            <div className="pt-4 border-t border-gray-50">
              <span className="text-xs text-gray-400 uppercase font-semibold">Notas</span>
              {editing
                ? <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm resize-none" />
                : <div className="text-sm text-gray-600 mt-0.5 whitespace-pre-line">{detail?.notes || 'Sem notas'}</div>}
            </div>
            <div className="flex justify-between pt-4 border-t border-gray-50">
              <button onClick={handleDelete} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 flex items-center gap-1">
                <Trash2 size={12} /> Excluir
              </button>
              <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg">Fechar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function ProjectsPage() {
  const [pipelines,        setPipelines]        = useState([]);
  const [projects,         setProjects]         = useState([]);
  const [clients,          setClients]          = useState([]);
  const [users,            setUsers]            = useState([]);
  const [businessTypes,    setBusinessTypes]    = useState([]);
  const [activePipeline,   setActivePipeline]   = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [selectedProject,  setSelectedProject]  = useState(null);
  const [view,             setView]             = useState('kanban');
  const [showNewProject,   setShowNewProject]   = useState(false);
  const [showNewStage,     setShowNewStage]     = useState(false);

  // Filters
  const [search,           setSearch]           = useState('');
  const [filterClient,     setFilterClient]     = useState('');
  const [filterResponsible,setFilterResponsible]= useState('');
  const [filterType,       setFilterType]       = useState('');

  // Load static data once
  useEffect(() => {
    const safe = (r) => { const d = r?.data; return Array.isArray(d) ? d : (d?.items ?? []); };
    Promise.allSettled([
      api.get('/crm/contacts'),
      api.get('/identity/users'),
      api.get('/commercial/business-types'),
    ]).then(([cR, uR, bR]) => {
      if (cR.status === 'fulfilled') setClients(safe(cR.value));
      if (uR.status === 'fulfilled') setUsers(safe(uR.value));
      if (bR.status === 'fulfilled') setBusinessTypes(safe(bR.value));
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, prRes] = await Promise.all([
        api.get('/projects/pipelines'),
        api.get('/projects'),
      ]);
      const pls = Array.isArray(pRes.data) ? pRes.data : [];
      const prs = Array.isArray(prRes.data) ? prRes.data : [];
      setPipelines(pls);
      setProjects(prs);
      if (!activePipeline && pls.length > 0) setActivePipeline(pls[0].id);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [activePipeline]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Lookup maps
  const clientMap = useMemo(() => {
    const m = {}; clients.forEach((c) => { m[c.id] = c.name || c.nome || `#${c.id}`; }); return m;
  }, [clients]);
  const userMap = useMemo(() => {
    const m = {}; users.forEach((u) => { m[u.id] = u.name || u.nome || u.email || `#${u.id}`; }); return m;
  }, [users]);
  const btMap = useMemo(() => {
    const m = {}; businessTypes.forEach((b) => { m[b.id] = b.name; }); return m;
  }, [businessTypes]);

  const currentPipeline = pipelines.find((p) => p.id === activePipeline);

  // Filtered projects for current pipeline
  const pipelineProjects = useMemo(() =>
    projects.filter((p) => p.pipelineId === activePipeline),
  [projects, activePipeline]);

  const filtered = useMemo(() => pipelineProjects.filter((p) => {
    if (search           && !p.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterClient     && String(p.clientId)      !== filterClient)               return false;
    if (filterResponsible&& String(p.responsibleId) !== filterResponsible)          return false;
    if (filterType       && String(p.businessTypeId)!== filterType)                 return false;
    return true;
  }), [pipelineProjects, search, filterClient, filterResponsible, filterType]);

  // Pipeline total value
  const pipelineTotal = useMemo(() =>
    pipelineProjects.reduce((sum, p) => sum + (p.value || 0), 0),
  [pipelineProjects]);

  // Filter options (derived from pipeline projects)
  const clientOpts = useMemo(() => {
    const ids = [...new Set(pipelineProjects.map((p) => p.clientId).filter(Boolean))];
    return [{ value: '', label: 'Todos os clientes' }, ...ids.map((id) => ({ value: String(id), label: clientMap[id] || `#${id}` }))];
  }, [pipelineProjects, clientMap]);

  const respOpts = useMemo(() => {
    const ids = [...new Set(pipelineProjects.map((p) => p.responsibleId).filter(Boolean))];
    return [{ value: '', label: 'Todos responsáveis' }, ...ids.map((id) => ({ value: String(id), label: userMap[id] || `#${id}` }))];
  }, [pipelineProjects, userMap]);

  const typeOpts = useMemo(() => {
    const ids = [...new Set(pipelineProjects.map((p) => p.businessTypeId).filter(Boolean))];
    return [{ value: '', label: 'Todos os tipos' }, ...ids.map((id) => ({ value: String(id), label: btMap[id] || `#${id}` }))];
  }, [pipelineProjects, btMap]);

  const handleDrop = async (projectId, stageId) => {
    try {
      await api.put(`/projects/${projectId}/move`, { stageId });
      setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, stageId } : p));
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-erplus-text flex items-center gap-2">
            Empreendimentos
            <Edit size={14} className="text-gray-400 cursor-pointer hover:text-erplus-accent transition-colors" />
          </h1>
          {currentPipeline && (
            <p className="text-sm text-erplus-text-muted mt-0.5">
              Pipeline: <span className="font-bold text-erplus-accent">{R$(pipelineTotal)}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewStage(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus size={14} /> Etapa
          </button>
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-erplus-accent/90 transition-colors shadow-sm"
          >
            <Plus size={16} /> Novo Empreendimento
          </button>
        </div>
      </div>

      {/* Pipeline tabs (se houver mais de 1) */}
      {pipelines.length > 1 && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {pipelines.map((p) => (
            <button key={p.id} onClick={() => { setActivePipeline(p.id); setSearch(''); setFilterClient(''); setFilterResponsible(''); setFilterType(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activePipeline === p.id ? 'bg-white text-erplus-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar empreendimento..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-erplus-accent/30 bg-white" />
        </div>

        {/* Kanban / Grade toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'kanban' ? 'bg-erplus-accent text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <GripVertical size={13} /> Kanban
          </button>
          <button onClick={() => setView('grade')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'grade' ? 'bg-erplus-accent text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <LayoutGrid size={13} /> Grade
          </button>
        </div>

        {/* Todos os clientes */}
        <div className="w-44">
          <Select value={filterClient} onChange={setFilterClient} options={clientOpts} placeholder="Todos os clientes" />
        </div>

        {/* Todos responsáveis */}
        <div className="w-44">
          <Select value={filterResponsible} onChange={setFilterResponsible} options={respOpts} placeholder="Todos responsáveis" />
        </div>

        {/* Todos os tipos */}
        <div className="w-40">
          <Select value={filterType} onChange={setFilterType} options={typeOpts} placeholder="Todos os tipos" />
        </div>

        {/* Count */}
        <span className="ml-auto text-xs text-gray-400 whitespace-nowrap font-medium">
          {filtered.length} empreendimento(s)
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : view === 'kanban' ? (
        currentPipeline ? (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {currentPipeline.stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                projects={filtered}
                clientMap={clientMap}
                userMap={userMap}
                btMap={btMap}
                onProjectClick={setSelectedProject}
                onDrop={handleDrop}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-300 text-sm">Nenhum pipeline configurado</div>
        )
      ) : (
        /* Grade view */
        filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-300 text-sm">Nenhum empreendimento encontrado</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <div key={p.id} onClick={() => setSelectedProject(p)}
                className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{p.title}</div>
                    {p.inscricaoImob && <div className="text-xs text-gray-400 mt-0.5">{fmtInsc(p.inscricaoImob)}</div>}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold flex-shrink-0">{p.stageName}</span>
                </div>
                {p.businessTypeId && btMap[p.businessTypeId] && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-semibold mb-2 inline-block">{btMap[p.businessTypeId]}</span>
                )}
                <div className="text-base font-bold text-erplus-accent mb-2">{R$(p.value)}</div>
                {p.endEmpreendimento && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin size={11} /><span className="truncate">{p.endEmpreendimento}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Modals */}
      {showNewProject && (
        <NewProjectModal
          pipelines={pipelines}
          clients={clients}
          users={users}
          businessTypes={businessTypes}
          onClose={() => setShowNewProject(false)}
          onSaved={fetchData}
        />
      )}
      {showNewStage && activePipeline && (
        <NewStageModal
          pipelineId={activePipeline}
          onClose={() => setShowNewStage(false)}
          onSaved={fetchData}
        />
      )}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          clientMap={clientMap}
          userMap={userMap}
          btMap={btMap}
          onClose={() => setSelectedProject(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
