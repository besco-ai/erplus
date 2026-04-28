import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Search, X, Save, ChevronRight, TrendingUp, DollarSign,
  FileText, Edit, Trash2, ArrowRight, Star, Filter, Settings,
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';
import { fmtDate } from '../../utils/date';
import Select from '../../components/ui/Select';

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const statusColors = {
  Ativo: 'bg-blue-50 text-blue-600',
  Ganho: 'bg-green-50 text-green-600',
  Perdido: 'bg-red-50 text-red-600',
};

function DealCard({ deal, onClick }) {
  return (
    <div
      onClick={() => onClick(deal)}
      className="bg-white rounded-lg border border-gray-100 p-3.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all mb-2"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-400">{deal.clientName || `#${deal.clientId}`}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[deal.dealStatus] || statusColors.Ativo}`}>
          {deal.dealStatus}
        </span>
      </div>
      <div className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2">{deal.title || deal.clientName}</div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-erplus-accent">{R$(deal.value)}</span>
        <span className="text-xs text-gray-400">{deal.probability}%</span>
      </div>
      {(deal.quotesCount > 0 || deal.contractsCount > 0) && (
        <div className="flex gap-2 mt-2 text-[10px] text-gray-400">
          {deal.quotesCount > 0 && <span>{deal.quotesCount} orç.</span>}
          {deal.contractsCount > 0 && <span>{deal.contractsCount} ctr.</span>}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ stage, deals, onDealClick, onDrop }) {
  const [dragOver, setDragOver] = useState(false);
  const stageDeals = deals.filter((d) => d.stageId === stage.id && d.dealStatus === 'Ativo');

  return (
    <div
      className={`flex-shrink-0 w-72 flex flex-col rounded-xl transition ${dragOver ? 'bg-red-50/50' : 'bg-gray-50/80'}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(stage.id); }}
    >
      {/* Column header */}
      <div className="px-3 py-3 border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-gray-700">{stage.name}</span>
          <span className="text-xs font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full">
            {stage.dealCount}
          </span>
        </div>
        <div className="text-xs font-semibold text-erplus-accent">{R$(stage.totalValue)}</div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        {stageDeals.map((deal) => (
          <div
            key={deal.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('dealId', deal.id.toString())}
          >
            <DealCard deal={deal} onClick={onDealClick} />
          </div>
        ))}
        {stageDeals.length === 0 && (
          <div className="text-center py-8 text-xs text-gray-300">Arraste um card aqui</div>
        )}
      </div>
    </div>
  );
}

// ── Sub-tabs do DealModal ──

function AtasTab({ dealId, atas, onChanged }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api.post(`/commercial/deals/${dealId}/atas`, {
        title: form.title, content: form.content, linksJson: null,
      });
      setForm({ title: '', content: '' });
      setCreating(false);
      onChanged();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const remove = async (ataId) => {
    if (!confirm('Excluir esta ata?')) return;
    await api.delete(`/commercial/deals/${dealId}/atas/${ataId}`);
    onChanged();
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setCreating((v) => !v)}
          className="text-xs font-semibold text-erplus-accent hover:underline flex items-center gap-1"
        >
          <Plus size={12} /> Nova ata
        </button>
      </div>

      {creating && (
        <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Título da ata"
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Conteúdo"
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setCreating(false)} className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded">Cancelar</button>
            <button
              onClick={save}
              disabled={saving || !form.title.trim()}
              className="px-3 py-1 text-xs text-white bg-erplus-accent rounded disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {atas.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">Nenhuma ata</p>
      ) : (
        atas.map((a) => (
          <div key={a.id} className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">{a.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{fmtDate(a.date)}</span>
                <button onClick={() => remove(a.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            {a.content && <p className="text-sm text-gray-600 whitespace-pre-line">{a.content}</p>}
          </div>
        ))
      )}
    </div>
  );
}

function ChecklistEditor({ itemsJson, onSave }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(itemsJson || '[]'); } catch { return []; }
  });
  const [saving, setSaving] = useState(false);

  const toggle = (i) => setItems((c) => c.map((it, idx) => (idx === i ? { ...it, done: !it.done } : it)));
  const commit = async () => {
    setSaving(true);
    try { await onSave(JSON.stringify(items)); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-1.5">
      {items.map((it, idx) => (
        <label key={idx} className="flex items-start gap-2 py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={!!it.done}
            onChange={() => toggle(idx)}
            className="mt-0.5"
          />
          <span className={`text-sm ${it.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
            {it.title}
            {it.required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
      ))}
      <div className="flex justify-end pt-2">
        <button
          onClick={commit}
          disabled={saving}
          className="px-3 py-1 text-xs font-semibold text-white bg-erplus-accent rounded disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar progresso'}
        </button>
      </div>
    </div>
  );
}

function DiligenceTab({ dealId, diligences, templates, onChanged }) {
  const [loadingId, setLoadingId] = useState('');

  const load = async () => {
    if (!loadingId) return;
    await api.post(`/commercial/deals/${dealId}/diligences`, { templateId: Number(loadingId) });
    setLoadingId('');
    onChanged();
  };

  const saveItems = (dilId) => async (itemsJson) => {
    await api.put(`/commercial/deals/${dealId}/diligences/${dilId}`, { itemsJson });
    onChanged();
  };

  return (
    <div>
      <div className="flex items-end gap-2 mb-4">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Carregar template</label>
          <Select
            value={loadingId}
            onChange={(v) => setLoadingId(v)}
            options={templates.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="Selecione um template..."
            className="w-full"
          />
        </div>
        <button
          onClick={load}
          disabled={!loadingId}
          className="px-4 py-2 bg-erplus-accent text-white rounded text-sm font-semibold disabled:opacity-50"
        >
          Carregar
        </button>
      </div>

      {diligences.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">Nenhuma diligência carregada</p>
      ) : (
        diligences.map((d) => (
          <div key={d.id} className="mb-4 p-3 border border-gray-100 rounded-lg">
            <div className="text-sm font-semibold mb-3">{d.templateName || `Template #${d.templateId}`}</div>
            <ChecklistEditor itemsJson={d.itemsJson} onSave={saveItems(d.id)} />
          </div>
        ))
      )}
    </div>
  );
}

function BriefingTab({ dealId, briefings, templates, onChanged }) {
  const [loadingId, setLoadingId] = useState('');

  const load = async () => {
    if (!loadingId) return;
    await api.post(`/commercial/deals/${dealId}/briefings`, { templateId: Number(loadingId) });
    setLoadingId('');
    onChanged();
  };

  const saveItems = (briefId) => async (itemsJson) => {
    await api.put(`/commercial/deals/${dealId}/briefings/${briefId}`, { itemsJson });
    onChanged();
  };

  return (
    <div>
      <div className="flex items-end gap-2 mb-4">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Carregar template</label>
          <Select
            value={loadingId}
            onChange={(v) => setLoadingId(v)}
            options={templates.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="Selecione um template..."
            className="w-full"
          />
        </div>
        <button
          onClick={load}
          disabled={!loadingId}
          className="px-4 py-2 bg-erplus-accent text-white rounded text-sm font-semibold disabled:opacity-50"
        >
          Carregar
        </button>
      </div>

      {briefings.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">Nenhum briefing carregado</p>
      ) : (
        briefings.map((b) => (
          <div key={b.id} className="mb-4 p-3 border border-gray-100 rounded-lg">
            <div className="text-sm font-semibold mb-3">{b.templateName || `Template #${b.templateId}`}</div>
            <ChecklistEditor itemsJson={b.itemsJson} onSave={saveItems(b.id)} />
          </div>
        ))
      )}
    </div>
  );
}

export function DealModal({ deal, onClose, onSaved }) {
  const [tab, setTab] = useState('dados');
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [atas, setAtas] = useState([]);
  const [diligences, setDiligences] = useState([]);
  const [briefings, setBriefings] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [diligenceTemplates, setDiligenceTemplates] = useState([]);
  const [briefingTemplates, setBriefingTemplates] = useState([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, atasRes, dilRes, briefRes, timelineRes, dtRes, btRes] = await Promise.all([
        api.get(`/commercial/deals/${deal.id}`),
        api.get(`/commercial/deals/${deal.id}/atas`),
        api.get(`/commercial/deals/${deal.id}/diligences`),
        api.get(`/commercial/deals/${deal.id}/briefings`),
        api.get(`/commercial/deals/${deal.id}/timeline`),
        api.get('/commercial/diligence-templates'),
        api.get('/commercial/briefing-templates'),
      ]);
      setForm(detail.data);
      setAtas(atasRes.data);
      setDiligences(dilRes.data);
      setBriefings(briefRes.data);
      setTimeline(timelineRes.data);
      setDiligenceTemplates(dtRes.data);
      setBriefingTemplates(btRes.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [deal.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleWin = async () => {
    if (!confirm('Marcar como GANHO?')) return;
    await api.post(`/commercial/deals/${deal.id}/win`);
    onSaved();
    onClose();
  };

  const handleLose = async () => {
    if (!confirm('Marcar como PERDIDO?')) return;
    await api.post(`/commercial/deals/${deal.id}/lose`);
    onSaved();
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm('Excluir este negócio?')) return;
    await api.delete(`/commercial/deals/${deal.id}`);
    onSaved();
    onClose();
  };

  const tabs = [
    { id: 'dados', label: 'Dados' },
    { id: 'orcamentos', label: `Orçamentos (${form?.quotes?.length || 0})` },
    { id: 'contratos', label: `Contratos (${form?.contracts?.length || 0})` },
    { id: 'atas', label: `Atas (${atas.length})` },
    { id: 'briefing', label: `Briefing (${briefings.length})` },
    { id: 'diligencia', label: `Diligência (${diligences.length})` },
    { id: 'timeline', label: `Timeline (${timeline.length})` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold">{deal.title || deal.clientName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-erplus-accent">{R$(deal.value)}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[deal.dealStatus]}`}>
                {deal.dealStatus}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {deal.dealStatus === 'Ativo' && (
              <>
                <button onClick={handleWin} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 flex items-center gap-1">
                  <Star size={12} /> Ganho
                </button>
                <button onClick={handleLose} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100">
                  Perdido
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 bg-gray-50/50">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition ${tab === t.id ? 'bg-white text-erplus-accent border-b-2 border-erplus-accent' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Carregando...</div>
          ) : tab === 'dados' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400">Etapa:</span> <strong>{form?.stageName}</strong></div>
                <div><span className="text-gray-400">Probabilidade:</span> <strong>{form?.probability}%</strong></div>
                <div><span className="text-gray-400">Registro:</span> {form?.registro || '—'}</div>
                <div><span className="text-gray-400">Inscrição:</span> {form?.inscricaoImob || '—'}</div>
                {form?.endEmpreendimento && (
                  <div className="col-span-2"><span className="text-gray-400">Endereço:</span> {form.endEmpreendimento}</div>
                )}
                {form?.notes && (
                  <div className="col-span-2"><span className="text-gray-400">Notas:</span> {form.notes}</div>
                )}
              </div>
            </div>
          ) : tab === 'orcamentos' ? (
            <div>
              {form?.quotes?.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Nenhum orçamento</p>
              ) : form?.quotes?.map((q) => (
                <div key={q.id} className="flex items-center justify-between p-3 border-b border-gray-50">
                  <div>
                    <div className="text-sm font-semibold">{q.numero} — {q.titulo}</div>
                    <div className="text-xs text-gray-400">{fmtDate(q.data)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-erplus-accent">{R$(q.valor)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      q.status === 'Aprovado' ? 'bg-green-50 text-green-600' :
                      q.status === 'Recusado' ? 'bg-red-50 text-red-600' :
                      q.status === 'Enviado' ? 'bg-blue-50 text-blue-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{q.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === 'contratos' ? (
            <div>
              {form?.contracts?.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Nenhum contrato</p>
              ) : form?.contracts?.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border-b border-gray-50">
                  <div>
                    <div className="text-sm font-semibold">{c.numero} — {c.titulo}</div>
                    <div className="text-xs text-gray-400">Início: {fmtDate(c.dataInicio)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-erplus-accent">{R$(c.valor)}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-600">{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === 'atas' ? (
            <AtasTab dealId={deal.id} atas={atas} onChanged={loadAll} />
          ) : tab === 'diligencia' ? (
            <DiligenceTab dealId={deal.id} diligences={diligences} templates={diligenceTemplates} onChanged={loadAll} />
          ) : tab === 'briefing' ? (
            <BriefingTab dealId={deal.id} briefings={briefings} templates={briefingTemplates} onChanged={loadAll} />
          ) : tab === 'timeline' ? (
            <div>
              {timeline.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Nenhum evento registrado</p>
              ) : (
                <div className="relative border-l-2 border-gray-100 ml-2">
                  {timeline.map((t) => (
                    <div key={t.id} className="pl-4 pb-4 relative">
                      <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-erplus-accent" />
                      <div className="text-xs text-gray-400">
                        {new Date(t.date).toLocaleString('pt-BR')} · <span className="font-mono">{t.type}</span>
                      </div>
                      <div className="text-sm mt-0.5">{t.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-3 border-t bg-gray-50/50">
          <button onClick={handleDelete} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 flex items-center gap-1">
            <Trash2 size={12} /> Excluir
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modais de gestão de pipeline ──

export function PipelineFormModal({ pipeline, onClose, onSaved }) {
  const isEdit = !!pipeline;
  const [name, setName] = useState(pipeline?.name || '');
  const [stages, setStages] = useState(() => (
    pipeline?.stages?.map((s) => ({
      id: s.id,
      name: s.name,
      autoTasksJson: s.autoTasksJson || '',
    })) || [{ name: 'Contato inicial', autoTasksJson: '' }]
  ));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateStage = (idx, key, value) => {
    setStages((curr) => curr.map((s, i) => (i === idx ? { ...s, [key]: value } : s)));
  };
  const addStage = () => setStages((c) => [...c, { name: '', autoTasksJson: '' }]);
  const removeStage = (idx) => setStages((c) => c.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await api.put(`/commercial/pipelines/${pipeline.id}`, { name });
        // Diff de stages
        const existingIds = new Set((pipeline.stages || []).map((s) => s.id));
        const submittedIds = new Set(stages.filter((s) => s.id).map((s) => s.id));
        for (let i = 0; i < stages.length; i++) {
          const s = stages[i];
          const payload = { name: s.name, order: i, autoTasksJson: s.autoTasksJson || null };
          if (s.id) await api.put(`/commercial/stages/${s.id}`, payload);
          else await api.post(`/commercial/pipelines/${pipeline.id}/stages`, payload);
        }
        for (const id of existingIds) {
          if (!submittedIds.has(id)) {
            try { await api.delete(`/commercial/stages/${id}`); }
            catch (e) { console.warn('Não foi possível excluir etapa', id, e.response?.data?.error); }
          }
        }
      } else {
        await api.post('/commercial/pipelines', {
          name,
          stages: stages.map((s, i) => ({ name: s.name, order: i, autoTasksJson: s.autoTasksJson || null })),
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? `Editar pipeline — ${pipeline.name}` : 'Novo Pipeline'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome do pipeline *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Atendimento Inicial"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Etapas</label>
              <button
                onClick={addStage}
                type="button"
                className="text-xs font-semibold text-erplus-accent hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> Adicionar etapa
              </button>
            </div>

            <div className="space-y-2">
              {stages.map((s, idx) => (
                <div key={s.id ?? `new-${idx}`} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-semibold w-6">#{idx + 1}</span>
                    <input
                      value={s.name}
                      onChange={(e) => updateStage(idx, 'name', e.target.value)}
                      placeholder="Nome da etapa"
                      className="flex-1 px-2.5 py-2 border border-gray-200 rounded text-sm"
                    />
                    {stages.length > 1 && (
                      <button
                        onClick={() => removeStage(idx)}
                        type="button"
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">
                      Tarefas automáticas (JSON array, opcional)
                    </label>
                    <input
                      value={s.autoTasksJson}
                      onChange={(e) => updateStage(idx, 'autoTasksJson', e.target.value)}
                      placeholder='Ex.: ["Primeiro contato","Enviar apresentação"]'
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PipelinePage({ mine = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const pipelineQueryId = searchParams.get('pipeline');
  const createPipelineFlag = searchParams.get('createPipeline');
  const { user } = useAuthStore();
  const [pipelines, setPipelines] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activePipeline, setActivePipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [draggedDealId, setDraggedDealId] = useState(null);
  const [pipelineModal, setPipelineModal] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dealsUrl = mine && user?.id
        ? `/commercial/deals?responsibleId=${user.id}`
        : '/commercial/deals';
      const [pRes, dRes] = await Promise.all([
        api.get('/commercial/pipelines'),
        api.get(dealsUrl),
      ]);
      setPipelines(pRes.data);
      setDeals(dRes.data);
      if (!activePipeline && pRes.data.length > 0) setActivePipeline(pRes.data[0].id);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [mine, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Seleciona o pipeline vindo por URL (?pipeline=ID) sempre que o param muda
  // e quando a lista de pipelines carrega. Permite a sidebar abrir diretamente
  // num pipeline específico.
  useEffect(() => {
    if (!pipelineQueryId) return;
    const id = Number(pipelineQueryId);
    if (!Number.isFinite(id)) return;
    if (pipelines.some((p) => p.id === id)) setActivePipeline(id);
  }, [pipelineQueryId, pipelines]);

  // A Sidebar aciona a criação de pipeline navegando com ?createPipeline=1.
  // Aqui abrimos o modal e limpamos o param para não reabrir em refresh.
  useEffect(() => {
    if (createPipelineFlag) {
      setPipelineModal('new');
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('createPipeline');
        return next;
      }, { replace: true });
    }
  }, [createPipelineFlag, setSearchParams]);

  const currentPipeline = pipelines.find((p) => p.id === activePipeline);

  const handleDrop = async (stageId) => {
    const dealIdStr = event?.dataTransfer?.getData('dealId');
    if (!dealIdStr) return;
    const dealId = Number(dealIdStr);
    try {
      await api.put(`/commercial/deals/${dealId}/move`, { stageId, pipelineId: activePipeline });
      fetchData();
    } catch { /* silent */ }
  };

  // Funnel stats
  const activeDeals = deals.filter((d) => d.dealStatus === 'Ativo');
  const totalValue = activeDeals.reduce((s, d) => s + (d.value || 0), 0);
  const wonQuotes = deals.filter((d) => d.dealStatus === 'Ganho').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-erplus-text">Pipeline Comercial</h1>
          <p className="text-sm text-erplus-text-muted mt-1">
            {activeDeals.length} negócio(s) ativo(s) · {R$(totalValue)} em pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPipelineModal('new')}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
          >
            <Plus size={14} /> Novo Pipeline
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition">
            <Plus size={16} /> Novo Negócio
          </button>
        </div>
      </div>

      {/* Pipeline tabs */}
      {pipelines.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-1 overflow-x-auto">
            {pipelines.map((p) => (
              <button key={p.id} onClick={() => setActivePipeline(p.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  activePipeline === p.id ? 'bg-white text-erplus-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {p.name}
              </button>
            ))}
          </div>
          {currentPipeline && (
            <>
              <button
                onClick={() => setPipelineModal(currentPipeline)}
                title="Editar pipeline e etapas"
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`Excluir o pipeline "${currentPipeline.name}"? Essa ação não pode ser desfeita.`)) return;
                  try {
                    await api.delete(`/commercial/pipelines/${currentPipeline.id}`);
                    setActivePipeline(null);
                    fetchData();
                  } catch (e) {
                    alert(e.response?.data?.error || 'Erro ao excluir pipeline');
                  }
                }}
                title="Excluir pipeline"
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Kanban board */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando pipeline...</div>
      ) : currentPipeline ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {currentPipeline.stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={deals.filter((d) => d.pipelineId === activePipeline)}
              onDealClick={(deal) => setSelectedDeal(deal)}
              onDrop={handleDrop}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">Nenhum pipeline encontrado</div>
      )}

      {/* Deal detail modal */}
      {selectedDeal && (
        <DealModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} onSaved={fetchData} />
      )}

      {pipelineModal && (
        <PipelineFormModal
          pipeline={pipelineModal === 'new' ? null : pipelineModal}
          onClose={() => setPipelineModal(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
