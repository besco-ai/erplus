import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, LayoutGrid, List, MapPin, X } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';
import { DealModal, PipelineFormModal } from './PipelinePage';
import Select from '../../components/ui/Select';

const R$ = (v) =>
  'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Gera iniciais a partir de um nome ou string
function initials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// Cores fixas por responsável (baseada no ID)
const AVATAR_COLORS = [
  'bg-erplus-accent', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
  'bg-amber-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500',
];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

// ─── Deal Card (design do screenshot) ────────────────────────────────────────
function DealCard({ deal, users, onClick, onDragStart }) {
  const responsible = users.find((u) => u.id === deal.responsibleId);
  const ini = responsible ? initials(responsible.name) : String(deal.responsibleId);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={() => onClick(deal)}
      className="bg-white rounded-xl border border-gray-100 p-3.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all mb-2 select-none border-l-[3px] border-l-green-400"
    >
      {/* Título + avatar */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm font-semibold text-gray-900 leading-snug">{deal.title}</span>
        <div
          className={`w-6 h-6 rounded-md ${avatarColor(deal.responsibleId)} text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0`}
        >
          {ini}
        </div>
      </div>

      {/* Registro */}
      {deal.registro && (
        <div className="text-xs text-gray-400 mb-1 font-mono">{deal.registro}</div>
      )}

      {/* Endereço */}
      {deal.endEmpreendimento && (
        <div className="flex items-start gap-1 text-xs text-gray-400 mb-1.5">
          <MapPin size={10} className="flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2 leading-snug">{deal.endEmpreendimento}</span>
        </div>
      )}

      {/* Tag tipo de negócio */}
      {deal.businessTypeName && (
        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-600 mb-2">
          {deal.businessTypeName}
        </span>
      )}

      {/* Valor + probabilidade */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-sm font-bold text-erplus-accent">{R$(deal.value)}</span>
        <span className="text-xs text-gray-400">{deal.probability}%</span>
      </div>
    </div>
  );
}

// ─── Coluna Kanban ────────────────────────────────────────────────────────────
function KanbanCol({ stage, deals, users, onDealClick, onDrop, onAddDeal }) {
  const [over, setOver] = useState(false);
  const activeDeals = deals.filter((d) => d.stageId === stage.id && d.dealStatus === 'Ativo');

  return (
    <div
      className={`flex-shrink-0 w-72 flex flex-col rounded-xl transition ${over ? 'bg-blue-50/40' : 'bg-gray-50/80'}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onDrop(stage.id, e); }}
    >
      {/* Cabeçalho */}
      <div className="px-3 py-3 border-b border-gray-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {/* drag-indicator dots */}
          <svg width="10" height="16" viewBox="0 0 10 16" className="text-gray-300 flex-shrink-0">
            {[0,4,8,12].map(y => [0,4].map(x => (
              <circle key={`${x}${y}`} cx={x+1} cy={y+2} r="1.2" fill="currentColor"/>
            )))}
          </svg>
          <span className="text-sm font-bold text-gray-700 truncate">{stage.name}</span>
          <span className="text-xs font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full flex-shrink-0">
            {activeDeals.length}
          </span>
        </div>
        <button
          onClick={() => onAddDeal(stage.id)}
          className="p-1 text-erplus-accent hover:bg-erplus-accent/10 rounded transition flex-shrink-0"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        {activeDeals.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-300">Nenhum item</div>
        ) : (
          activeDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              users={users}
              onClick={onDealClick}
              onDragStart={(e) => e.dataTransfer.setData('dealId', String(deal.id))}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Modal de novo negócio (simples) ─────────────────────────────────────────
function NewDealModal({ pipelineId, defaultStageId, stages, users, onClose, onSaved }) {
  const { user: currentUser } = useAuthStore();
  const [form, setForm] = useState({
    title: '',
    value: '',
    stageId: defaultStageId || stages[0]?.id || '',
    responsibleId: currentUser?.id || 1,
    probability: 50,
    registro: '',
    endEmpreendimento: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const save = async () => {
    if (!form.title.trim()) { setError('Título obrigatório'); return; }
    setSaving(true);
    try {
      await api.post('/commercial/deals', {
        title:             form.title.trim(),
        clientId:          1,
        value:             Number(form.value) || 0,
        pipelineId,
        stageId:           Number(form.stageId),
        responsibleId:     Number(form.responsibleId),
        probability:       Number(form.probability),
        registro:          form.registro || null,
        endEmpreendimento: form.endEmpreendimento || null,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">Novo Negócio</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input value={form.title} onChange={(e) => f('title')(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20"
              placeholder="Nome do negócio / cliente" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Valor</label>
              <input type="number" value={form.value} onChange={(e) => f('value')(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20"
                placeholder="0,00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Probabilidade %</label>
              <input type="number" min={0} max={100} value={form.probability} onChange={(e) => f('probability')(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Etapa</label>
            <Select value={form.stageId} onChange={f('stageId')}
              options={stages.map((s) => ({ value: s.id, label: s.name }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Responsável</label>
            <Select value={form.responsibleId} onChange={f('responsibleId')}
              options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Registro</label>
            <input value={form.registro} onChange={(e) => f('registro')(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20"
              placeholder="Ex: 01-15-02-50-01" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Endereço</label>
            <input value={form.endEmpreendimento} onChange={(e) => f('endEmpreendimento')(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20"
              placeholder="Rua, nº - Bairro, Cidade/UF" />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancelar
          </button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg hover:bg-erplus-accent/90 disabled:opacity-50 flex items-center gap-2">
            <Plus size={14} />{saving ? 'Salvando...' : 'Criar Negócio'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página dedicada ──────────────────────────────────────────────────────────
export default function PipelineDetailPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const pipelineId  = Number(id);

  const [pipeline, setPipeline]       = useState(null);
  const [deals, setDeals]             = useState([]);
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedDeal, setSelectedDeal]   = useState(null);
  const [newDealStage, setNewDealStage]   = useState(null); // stageId for new deal
  const [showNewDeal, setShowNewDeal]     = useState(false);
  const [pipelineModal, setPipelineModal] = useState(null);

  // Filtros
  const [search, setSearch]       = useState('');
  const [filterResp, setFilterResp] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode]   = useState('kanban'); // 'kanban' | 'grade'

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pipRes, dealRes, userRes] = await Promise.all([
        api.get('/commercial/pipelines'),
        api.get(`/commercial/deals?pipelineId=${pipelineId}`),
        api.get('/identity/users'),
      ]);
      const found = (pipRes.data || []).find((p) => p.id === pipelineId);
      if (!found) { navigate('/comercial'); return; }
      setPipeline(found);
      setDeals(dealRes.data || []);
      setUsers(userRes.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [pipelineId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDrop = async (stageId, e) => {
    const dealIdStr = e.dataTransfer.getData('dealId');
    if (!dealIdStr) return;
    try {
      await api.put(`/commercial/deals/${dealIdStr}/move`, { stageId, pipelineId });
      fetchData();
    } catch { /* silent */ }
  };

  // Valor total do pipeline (deals ativos)
  const totalValue = useMemo(
    () => deals.filter((d) => d.dealStatus === 'Ativo').reduce((s, d) => s + (d.value || 0), 0),
    [deals]
  );

  // Deals filtrados
  const filteredDeals = useMemo(() => {
    let list = deals;
    if (search)       list = list.filter((d) => (d.title + d.registro + d.endEmpreendimento).toLowerCase().includes(search.toLowerCase()));
    if (filterResp)   list = list.filter((d) => String(d.responsibleId) === String(filterResp));
    if (filterType)   list = list.filter((d) => String(d.businessTypeId) === String(filterType));
    if (filterStatus) list = list.filter((d) => d.dealStatus === filterStatus);
    return list;
  }, [deals, search, filterResp, filterType, filterStatus]);

  const activeCount = filteredDeals.filter((d) => d.dealStatus === 'Ativo').length;

  // Opções para filtros
  const respOptions  = useMemo(() => [
    { value: '', label: 'Todos responsáveis' },
    ...users.map((u) => ({ value: u.id, label: u.name })),
  ], [users]);

  const typeOptions  = useMemo(() => {
    const types = [...new Map(
      deals.filter((d) => d.businessTypeId).map((d) => [d.businessTypeId, d.businessTypeName])
    ).entries()].map(([id, name]) => ({ value: id, label: name || `Tipo #${id}` }));
    return [{ value: '', label: 'Todos os tipos' }, ...types];
  }, [deals]);

  const statusOptions = [
    { value: '',        label: 'Todos status' },
    { value: 'Ativo',   label: 'Ativo' },
    { value: 'Ganho',   label: 'Ganho' },
    { value: 'Perdido', label: 'Perdido' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Carregando...</div>
  );

  if (!pipeline) return null;

  return (
    <div className="space-y-4">
      {/* ── Cabeçalho ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-erplus-text">{pipeline.name}</h1>
            <button
              onClick={() => setPipelineModal(pipeline)}
              className="p-1 text-gray-400 hover:text-blue-500 transition"
              title="Editar pipeline"
            >
              <Edit2 size={14} />
            </button>
          </div>
          <p className="text-sm font-semibold text-erplus-accent mt-0.5">
            Pipeline: {R$(totalValue)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPipelineModal({ ...pipeline, _addStage: true })}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
          >
            <Plus size={14} /> Etapa
          </button>
          <button
            onClick={() => { setNewDealStage(pipeline.stages[0]?.id); setShowNewDeal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-erplus-accent/90 transition"
          >
            <Plus size={15} /> Novo Negócio
          </button>
        </div>
      </div>

      {/* ── Barra de filtros ── */}
      <div className="bg-white rounded-xl shadow-sm px-4 py-2.5 flex items-center gap-3 flex-wrap">
        {/* Busca */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar negócio..."
            className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm w-44 focus:outline-none focus:ring-2 focus:ring-erplus-accent/20"
          />
        </div>

        {/* Kanban / Grade toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${viewMode === 'kanban' ? 'bg-white text-erplus-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid size={13} /> Kanban
          </button>
          <button
            onClick={() => setViewMode('grade')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${viewMode === 'grade' ? 'bg-white text-erplus-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List size={13} /> Grade
          </button>
        </div>

        {/* Filtros */}
        <Select value={filterResp}   onChange={setFilterResp}   options={respOptions}   className="text-xs w-44" />
        <Select value={filterType}   onChange={setFilterType}   options={typeOptions}   className="text-xs w-40" />
        <Select value={filterStatus} onChange={setFilterStatus} options={statusOptions} className="text-xs w-36" />

        {/* Contador */}
        <span className="text-xs font-semibold text-gray-500 ml-auto whitespace-nowrap">
          {activeCount} negócio{activeCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Kanban ── */}
      {viewMode === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {pipeline.stages.map((stage) => (
            <KanbanCol
              key={stage.id}
              stage={stage}
              deals={filteredDeals}
              users={users}
              onDealClick={(deal) => setSelectedDeal(deal)}
              onDrop={handleDrop}
              onAddDeal={(stageId) => { setNewDealStage(stageId); setShowNewDeal(true); }}
            />
          ))}
        </div>
      )}

      {/* ── Grade (lista) ── */}
      {viewMode === 'grade' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Negócio</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Etapa</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Tipo</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Valor</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">%</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal) => (
                <tr
                  key={deal.id}
                  onClick={() => setSelectedDeal(deal)}
                  className="border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{deal.title}</div>
                    {deal.endEmpreendimento && (
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={9} />{deal.endEmpreendimento}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{deal.stageName}</td>
                  <td className="px-4 py-3">
                    {deal.businessTypeName && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-600">
                        {deal.businessTypeName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-erplus-accent">{R$(deal.value)}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{deal.probability}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      deal.dealStatus === 'Ganho'   ? 'bg-green-50 text-green-600' :
                      deal.dealStatus === 'Perdido' ? 'bg-red-50 text-red-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>{deal.dealStatus}</span>
                  </td>
                </tr>
              ))}
              {filteredDeals.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-300 text-sm">Nenhum negócio encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modais ── */}
      {selectedDeal && (
        <DealModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} onSaved={fetchData} />
      )}

      {showNewDeal && (
        <NewDealModal
          pipelineId={pipelineId}
          defaultStageId={newDealStage}
          stages={pipeline.stages}
          users={users}
          onClose={() => setShowNewDeal(false)}
          onSaved={fetchData}
        />
      )}

      {pipelineModal && (
        <PipelineFormModal
          pipeline={pipelineModal === 'new' ? null : pipelineModal}
          onClose={() => setPipelineModal(null)}
          onSaved={() => { setPipelineModal(null); fetchData(); }}
        />
      )}
    </div>
  );
}
