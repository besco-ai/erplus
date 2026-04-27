import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Save, Edit, Trash2, MapPin, Ruler, Building, Kanban, LayoutGrid } from 'lucide-react';
import api from '../../services/api';
import { fmtDate } from '../../utils/date';

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const fmtInsc = (v) => {
  if (!v) return '';
  const d = String(v).replace(/\D/g, '').slice(0, 10);
  const p = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 6), d.slice(6, 8), d.slice(8, 12)].filter((x) => x);
  return p.join('-');
};

function ProjectCard({ project, onClick }) {
  return (
    <div onClick={() => onClick(project)}
      className="bg-white rounded-lg border border-gray-100 p-3.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all mb-2">
      <div className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2">{project.title}</div>
      {project.inscricaoImob && (
        <div className="text-xs text-gray-400 mb-1">{fmtInsc(project.inscricaoImob)}</div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-erplus-accent">{R$(project.value)}</span>
        {project.endEmpreendimento && <MapPin size={12} className="text-gray-300" />}
      </div>
    </div>
  );
}

function KanbanColumn({ stage, projects, onProjectClick, onDrop }) {
  const [dragOver, setDragOver] = useState(false);
  const stageProjects = projects.filter((p) => p.stageId === stage.id);

  return (
    <div
      className={`flex-shrink-0 w-72 flex flex-col rounded-xl transition ${dragOver ? 'bg-red-50/50' : 'bg-gray-50/80'}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const id = e.dataTransfer.getData('projectId'); if (id) onDrop(Number(id), stage.id); }}>
      <div className="px-3 py-3 border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-gray-700">{stage.name}</span>
          <span className="text-xs font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full">{stage.projectCount}</span>
        </div>
        <div className="text-xs font-semibold text-erplus-accent">{R$(stage.totalValue)}</div>
      </div>
      <div className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        {stageProjects.map((p) => (
          <div key={p.id} draggable onDragStart={(e) => e.dataTransfer.setData('projectId', p.id.toString())}>
            <ProjectCard project={p} onClick={onProjectClick} />
          </div>
        ))}
        {stageProjects.length === 0 && <div className="text-center py-8 text-xs text-gray-300">Arraste um card aqui</div>}
      </div>
    </div>
  );
}

function ProjectDetailModal({ project, onClose, onSaved }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/projects/${project.id}`);
        setDetail(data);
        setForm(data);
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
      setEditing(false);
      onSaved();
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    if (!confirm('Excluir este empreendimento?')) return;
    await api.delete(`/projects/${project.id}`);
    onSaved();
    onClose();
  };

  const Field = ({ label, value, field, editable = true }) => (
    <div>
      <span className="text-xs text-gray-400 uppercase font-semibold">{label}</span>
      {editing && editable ? (
        <input value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm" />
      ) : (
        <div className="text-sm font-medium mt-0.5">{value || '—'}</div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">{detail?.title || project.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-erplus-accent">{R$(project.value)}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">{project.stageName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
            ) : (
              <button onClick={handleSave} className="px-3 py-1.5 bg-erplus-accent text-white rounded-lg text-xs font-semibold flex items-center gap-1"><Save size={12} /> Salvar</button>
            )}
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
        </div>

        {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
          <div className="space-y-6">
            {/* Dados do empreendimento */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Building size={14} /> Dados Gerais</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Registro" value={detail?.registro} field="registro" />
                <Field label="Inscrição Imobiliária" value={fmtInsc(detail?.inscricaoImob)} field="inscricaoImob" />
                <div className="col-span-2">
                  <Field label="Endereço" value={detail?.endEmpreendimento} field="endEmpreendimento" />
                </div>
                <Field label="Início" value={fmtDate(detail?.startDate)} field="startDate" editable={false} />
                <Field label="Previsão Término" value={fmtDate(detail?.endDate)} field="endDate" editable={false} />
              </div>
            </div>

            {/* Dados do terreno */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Ruler size={14} /> Dados do Terreno</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipologia" value={detail?.tipologiaTerreno} field="tipologiaTerreno" />
                <Field label="Morfologia" value={detail?.morfologiaTerreno} field="morfologiaTerreno" />
                <Field label="Testada (m)" value={detail?.testada} field="testada" />
                <Field label="Área (m²)" value={detail?.areaTerreno} field="areaTerreno" />
              </div>
            </div>

            {/* Notas */}
            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold">Notas</span>
              {editing ? (
                <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                  className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm resize-none" />
              ) : (
                <div className="text-sm text-gray-600 mt-0.5 whitespace-pre-line">{detail?.notes || 'Sem notas'}</div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between pt-4 border-t">
              <button onClick={handleDelete} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 flex items-center gap-1">
                <Trash2 size={12} /> Excluir
              </button>
              <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Fechar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [pipelines, setPipelines] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activePipeline, setActivePipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [view, setView] = useState('kanban'); // 'kanban' | 'grid'

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, prRes] = await Promise.all([
        api.get('/projects/pipelines'),
        api.get('/projects'),
      ]);
      setPipelines(pRes.data);
      setProjects(prRes.data);
      if (!activePipeline && pRes.data.length > 0) setActivePipeline(pRes.data[0].id);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentPipeline = pipelines.find((p) => p.id === activePipeline);

  const handleDrop = async (projectId, stageId) => {
    try {
      await api.put(`/projects/${projectId}/move`, { stageId });
      fetchData();
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-erplus-text">Empreendimentos</h1>
          <p className="text-sm text-erplus-text-muted mt-1">{projects.length} empreendimento(s)</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${view === 'kanban' ? 'bg-white shadow-sm text-erplus-accent' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Kanban size={14} />
              Kanban
            </button>
            <button
              onClick={() => setView('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${view === 'grid' ? 'bg-white shadow-sm text-erplus-accent' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid size={14} />
              Grade
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition">
            <Plus size={16} /> Novo Empreendimento
          </button>
        </div>
      </div>

      {/* Pipeline tabs */}
      {pipelines.length > 1 && (
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {pipelines.map((p) => (
            <button key={p.id} onClick={() => setActivePipeline(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activePipeline === p.id ? 'bg-white text-erplus-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : view === 'kanban' ? (
        /* ── Kanban View ── */
        currentPipeline ? (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {currentPipeline.stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                projects={projects.filter((p) => p.pipelineId === activePipeline)}
                onProjectClick={(p) => setSelectedProject(p)}
                onDrop={handleDrop}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">Nenhum pipeline encontrado</div>
        )
      ) : (
        /* ── Grid View ── */
        projects.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhum empreendimento encontrado</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects
              .filter((p) => !activePipeline || p.pipelineId === activePipeline)
              .map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">{p.title}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold flex-shrink-0">{p.stageName}</span>
                  </div>
                  {p.inscricaoImob && (
                    <div className="text-xs text-gray-400 mb-2">{p.inscricaoImob}</div>
                  )}
                  <div className="text-base font-bold text-erplus-accent mb-2">
                    {'R$ ' + Number(p.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  {p.endEmpreendimento && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin size={11} />
                      <span className="truncate">{p.endEmpreendimento}</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )
      )}

      {selectedProject && (
        <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} onSaved={fetchData} />
      )}
    </div>
  );
}
