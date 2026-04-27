import { useState, useEffect, useCallback } from 'react';
import {
  Plus, X, Save, ChevronLeft, ChevronRight, Clock, Trash2,
  Edit, Calendar, CheckSquare, LayoutList, CalendarDays, StickyNote,
  RotateCw, AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';
import DatePicker from '../../components/ui/DatePicker';
import TimePicker from '../../components/ui/TimePicker';
import { fmtDate } from '../../utils/date';
import Select from '../../components/ui/Select';

const EVENT_CATEGORIES = [
  { value: 'geral',      label: 'Geral',      color: '#10B981' },
  { value: 'reuniao',    label: 'Reunião',     color: '#8B5CF6' },
  { value: 'comercial',  label: 'Comercial',   color: '#C41E2A' },
  { value: 'producao',   label: 'Produção',    color: '#3B82F6' },
  { value: 'pessoal',    label: 'Pessoal',     color: '#F59E0B' },
];
const NOTE_TIPOS = ['Geral', 'Comercial', 'Produção', 'Reunião', 'Pessoal'];
const NOTE_COLOR = '#F59E0B';
const RECURRENCES = ['Sem recorrência', 'Diariamente', 'Semanalmente', 'Mensalmente'];
const VISIBILITIES = [
  { value: 'compartilhada', label: 'Compartilhada (todos)' },
  { value: 'privada',       label: 'Particular (só eu)' },
];
const REF_TYPES = [
  { value: '',        label: '— Nenhum —' },
  { value: 'deal',    label: 'Negócio' },
  { value: 'project', label: 'Empreendimento' },
];

const isAnnotation = (ev) => ev?.type?.startsWith('anotacao');
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ─── Modal: Novo / Editar Evento ─────────────────────────────────────────────
function EventModal({ event, onClose, onSaved, users, deals, projects }) {
  const { user: currentUser } = useAuthStore();
  const isEdit = !!event;

  const catColor = (type) => EVENT_CATEGORIES.find((c) => c.value === type)?.color || '#10B981';

  const [form, setForm] = useState({
    title:           event?.title || '',
    date:            event?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    time:            event?.time || '09:00',
    durationMinutes: event?.durationMinutes || 60,
    type:            event?.type || 'geral',
    recurrence:      event?.recurrence || 'Sem recorrência',
    refType:         event?.refType || '',
    refId:           event?.refId || '',
    responsibleId:   event?.responsibleId || currentUser?.id || 1,
    visibility:      event?.visibility || 'compartilhada',
    notes:           event?.notes || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  // Opções de vínculo dependem do refType
  const refOptions = form.refType === 'deal'
    ? deals.map((d) => ({ value: d.id, label: d.title }))
    : form.refType === 'project'
    ? projects.map((p) => ({ value: p.id, label: p.title }))
    : [];

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Título obrigatório'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        title:           form.title.trim(),
        date:            form.date,
        time:            form.time,
        durationMinutes: Number(form.durationMinutes),
        type:            form.type,
        color:           catColor(form.type),
        recurrence:      form.recurrence,
        refType:         form.refType || null,
        refId:           form.refId ? Number(form.refId) : null,
        responsibleId:   Number(form.responsibleId),
        visibility:      form.visibility,
        notes:           form.notes || null,
      };
      if (isEdit) await api.put(`/schedule/events/${event.id}`, payload);
      else        await api.post('/schedule/events', payload);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const userOptions = users.length > 0
    ? users.map((u) => ({ value: u.id, label: u.name }))
    : [{ value: currentUser?.id, label: currentUser?.name }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: catColor(form.type) }} />
            {isEdit ? 'Editar Evento' : 'Novo Evento'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input value={form.title} onChange={(e) => f('title')(e.target.value)}
              placeholder="Ex: Reunião com cliente"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20" />
          </div>

          {/* Data + Horário */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data</label>
              <DatePicker value={form.date} onChange={f('date')} className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Horário</label>
              <TimePicker value={form.time} onChange={f('time')} className="w-full" />
            </div>
          </div>

          {/* Duração + Recorrência */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Duração (min)</label>
              <input type="number" min={15} step={15} value={form.durationMinutes}
                onChange={(e) => f('durationMinutes')(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Recorrência</label>
              <Select value={form.recurrence} onChange={f('recurrence')} options={RECURRENCES} className="w-full" />
            </div>
          </div>

          {form.recurrence !== 'Sem recorrência' && (
            <div className="p-2.5 bg-blue-50 rounded-lg text-xs text-blue-700 font-medium">
              {{
                'Diariamente':  '30 ocorrências — todos os dias a partir da data escolhida',
                'Semanalmente': '12 ocorrências — uma vez por semana durante 3 meses',
                'Mensalmente':  '12 ocorrências — uma vez por mês durante 1 ano',
              }[form.recurrence]}
            </div>
          )}

          {/* Vincular a */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Vincular a <span className="text-gray-400 normal-case font-normal">(liga o evento a um negócio ou empreendimento)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={form.refType}
                onChange={(v) => setForm((p) => ({ ...p, refType: v, refId: '' }))}
                options={REF_TYPES}
                className="w-full"
              />
              {form.refType ? (
                <Select
                  value={form.refId}
                  onChange={f('refId')}
                  options={[{ value: '', label: '— Selecionar —' }, ...refOptions]}
                  className="w-full"
                  placeholder="— Selecionar —"
                />
              ) : (
                <div className="flex items-center px-3 text-xs text-gray-400 border border-gray-200 rounded-lg bg-gray-50">
                  Selecione o tipo primeiro
                </div>
              )}
            </div>
          </div>

          {/* Responsável + Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Responsável</label>
              <Select value={form.responsibleId} onChange={f('responsibleId')} options={userOptions} className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Categoria <span className="text-gray-400 normal-case font-normal">(tipo do evento)</span>
              </label>
              <Select
                value={form.type}
                onChange={f('type')}
                options={EVENT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                className="w-full"
              />
            </div>
          </div>

          {/* Visibilidade */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Visibilidade</label>
            <Select value={form.visibility} onChange={f('visibility')} options={VISIBILITIES} className="w-full" />
            {form.visibility === 'privada' && (
              <p className="text-xs text-gray-400 mt-1">Apenas você verá este evento na agenda.</p>
            )}
            {form.visibility === 'compartilhada' && (
              <p className="text-xs text-gray-400 mt-1">Todos os membros da equipe poderão ver este evento.</p>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Observações</label>
            <textarea value={form.notes} onChange={(e) => f('notes')(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none" />
          </div>
        </div>

        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 flex items-center gap-2 hover:bg-erplus-accent/90 transition">
            <Save size={14} />{saving ? 'Salvando...' : (isEdit ? 'Salvar' : 'Criar')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Nova Anotação ────────────────────────────────────────────────────
function AnnotationModal({ onClose, onSaved, users, deals, selectedDate }) {
  const { user: currentUser } = useAuthStore();
  const [form, setForm] = useState({
    title: '',
    date: selectedDate || new Date().toISOString().slice(0, 10),
    recurrence: 'Sem recorrência',
    dealId: '',
    responsibleId: currentUser?.id || 1,
    visibility: 'Compartilhada (todos)',
    tipo: 'Geral',
    notes: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Título obrigatório'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/schedule/events', {
        title: form.title,
        date: form.date,
        time: null,
        durationMinutes: 0,
        type: `anotacao_${form.tipo.toLowerCase().replace(/ã/g, 'a').replace(/ç/g, 'c').replace(/\s+/g, '_')}`,
        color: NOTE_COLOR,
        notes: form.notes || null,
        responsibleId: Number(form.responsibleId),
        refId: form.dealId ? Number(form.dealId) : null,
        recurrence: form.recurrence,
        visibility: form.visibility,
      });
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro ao criar anotação'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <StickyNote size={18} className="text-amber-500" /> Nova Anotação
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input value={form.title} onChange={(e) => f('title')(e.target.value)}
              placeholder="Ex: Lembrete de reunião"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400" />
          </div>
          {/* Data + Recorrência */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data</label>
              <DatePicker value={form.date} onChange={(v) => f('date')(v)}
                className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Recorrência</label>
              <Select
                value={form.recurrence}
                onChange={(v) => f('recurrence')(v)}
                options={RECURRENCES}
                className="w-full"
              />
            </div>
          </div>
          {/* Vincular a + Responsável */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vincular a negócio</label>
              <Select
                value={form.dealId}
                onChange={(v) => f('dealId')(v)}
                options={[{ value: '', label: '— Nenhum —' }, ...(deals || []).map((d) => ({ value: d.id, label: d.title }))]}
                placeholder="— Nenhum —"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Responsável</label>
              <Select
                value={form.responsibleId}
                onChange={(v) => f('responsibleId')(v)}
                options={users.length > 0
                  ? users.map((u) => ({ value: u.id, label: u.name }))
                  : [{ value: currentUser?.id, label: currentUser?.name }]}
                className="w-full"
              />
            </div>
          </div>
          {/* Visibilidade + Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Visibilidade</label>
              <Select
                value={form.visibility}
                onChange={(v) => f('visibility')(v)}
                options={VISIBILITIES}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo</label>
              <Select
                value={form.tipo}
                onChange={(v) => f('tipo')(v)}
                options={NOTE_TIPOS}
                className="w-full"
              />
            </div>
          </div>
          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Observações</label>
            <textarea value={form.notes} onChange={(e) => f('notes')(e.target.value)} rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none" />
          </div>
        </div>
        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 flex items-center gap-2 hover:bg-erplus-accent/90 transition">
            <Save size={14} />{saving ? 'Salvando...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Nova Tarefa ──────────────────────────────────────────────────────
function TaskModal({ onClose, onSaved, users, deals, projects, selectedDate }) {
  const { user: currentUser } = useAuthStore();
  const [form, setForm] = useState({
    title: '',
    due: selectedDate || new Date().toISOString().slice(0, 10),
    recurrence: 'Sem recorrência',
    responsibleId: currentUser?.id || 1,
    visibility: 'Compartilhada (todos)',
    description: '',
    dealId: '',
    projectId: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const genDates = (start, rec) => {
    if (!start || rec === 'Sem recorrência') return [start];
    const base = new Date(start + 'T12:00:00');
    if (rec === 'Diariamente')  return Array.from({ length: 30 }, (_, i) => { const d = new Date(base); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10); });
    if (rec === 'Semanalmente') return Array.from({ length: 12 }, (_, i) => { const d = new Date(base); d.setDate(d.getDate() + i * 7); return d.toISOString().slice(0, 10); });
    if (rec === 'Mensalmente')  return Array.from({ length: 12 }, (_, i) => { const d = new Date(base); d.setMonth(d.getMonth() + i); return d.toISOString().slice(0, 10); });
    return [start];
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Título obrigatório'); return; }
    setSaving(true); setError('');
    try {
      const dates = genDates(form.due, form.recurrence);
      await Promise.all(dates.map((due) =>
        api.post('/tasks', {
          title: form.title,
          description: form.description || null,
          responsibleId: Number(form.responsibleId),
          due: due || null,
          dealId: form.dealId ? Number(form.dealId) : null,
          projectId: form.projectId ? Number(form.projectId) : null,
          category: null,
        })
      ));
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro ao criar tarefa'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Nova Tarefa</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input value={form.title} onChange={(e) => f('title')(e.target.value)}
              placeholder="Ex: Preparar relatório mensal"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20" />
          </div>
          {/* Data + Recorrência */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data</label>
              <DatePicker value={form.due} onChange={(v) => f('due')(v)}
                className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Recorrência</label>
              <Select
                value={form.recurrence}
                onChange={(v) => f('recurrence')(v)}
                options={RECURRENCES}
                className="w-full"
              />
            </div>
          </div>
          {/* Vincular a + Responsável */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vincular a negócio</label>
              <Select
                value={form.dealId || ''}
                onChange={(v) => f('dealId')(v)}
                options={[{ value: '', label: '— Nenhum —' }, ...(deals || []).map((d) => ({ value: d.id, label: d.title }))]}
                placeholder="— Nenhum —"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Responsável</label>
              <Select
                value={form.responsibleId}
                onChange={(v) => f('responsibleId')(v)}
                options={users.length > 0
                  ? users.map((u) => ({ value: u.id, label: u.name }))
                  : [{ value: currentUser?.id, label: currentUser?.name }]}
                className="w-full"
              />
            </div>
          </div>
          {/* Visibilidade */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Visibilidade</label>
            <Select
              value={form.visibility}
              onChange={(v) => f('visibility')(v)}
              options={VISIBILITIES}
              className="w-full"
            />
          </div>
          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Observações</label>
            <textarea value={form.description} onChange={(e) => f('description')(e.target.value)} rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none" />
          </div>
        </div>
        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 flex items-center gap-2 hover:bg-erplus-accent/90 transition">
            <CheckSquare size={14} />{saving ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Recurrence Manager Modal ────────────────────────────────────────────────
function RecurrenceManagerModal({ onClose, onChanged }) {
  const [series, setSeries]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null); // recurrenceId being deleted

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/schedule/events/series');
      setSeries(data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (recurrenceId) => {
    setDeleting(recurrenceId);
    try {
      await api.delete(`/schedule/events/series/${recurrenceId}`);
      setSeries((prev) => prev.filter((s) => s.recurrenceId !== recurrenceId));
      onChanged();
    } catch { /* silent */ } finally { setDeleting(null); }
  };

  const TYPE_LABEL = { geral: 'Geral', reuniao: 'Reunião', comercial: 'Comercial', producao: 'Produção', pessoal: 'Pessoal' };
  const REC_LABEL  = { Diariamente: 'Diário', Semanalmente: 'Semanal', Mensalmente: 'Mensal' };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <RotateCw size={16} className="text-erplus-accent" />
              Séries Recorrentes
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Gerencie e exclua séries inteiras de uma vez</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-3">
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Carregando...</div>
          ) : series.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              <RotateCw size={28} className="mx-auto mb-2 opacity-30" />
              Nenhuma série recorrente ativa
            </div>
          ) : (
            <div className="space-y-2">
              {series.map((s) => (
                <div key={s.recurrenceId}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50/60 transition-colors">
                  {/* Color dot */}
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color || '#10B981' }} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{s.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {TYPE_LABEL[s.type] || s.type}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium flex items-center gap-0.5">
                        <RotateCw size={8} /> {REC_LABEL[s.recurrence] || s.recurrence}
                      </span>
                      <span className="text-xs text-gray-400">
                        {s.count} ocorrência{s.count !== 1 ? 's' : ''} · {s.firstDate.split('-').reverse().join('/')} → {s.lastDate.split('-').reverse().join('/')}
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(s.recurrenceId)}
                    disabled={deleting === s.recurrenceId}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-40 flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    {deleting === s.recurrenceId ? 'Excluindo...' : 'Excluir série'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ────────────────────────────────────────────────────
function DeleteConfirmModal({ entry, onClose, onDeleteOne, onDeleteSeries }) {
  const isTask   = entry._isTask;
  const isAnnot  = isAnnotation(entry);
  const isSeries = !!entry.recurrenceId;
  const [loading, setLoading] = useState(false);

  const label = isTask ? 'tarefa' : isAnnot ? 'anotação' : 'evento';

  const handle = async (fn) => {
    setLoading(true);
    try { await fn(); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-5">

        {/* Title + subtitle */}
        <h3 className="text-sm font-bold text-gray-900">
          Excluir {label} &ldquo;{entry.title}&rdquo;?
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {isSeries
            ? 'Este item faz parte de uma série recorrente. Escolha o que deseja excluir.'
            : 'Esta ação não pode ser desfeita.'}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition disabled:opacity-50"
          >
            Cancelar
          </button>

          {isSeries ? (
            <>
              <button
                onClick={() => handle(onDeleteOne)}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Só este
              </button>
              <button
                onClick={() => handle(onDeleteSeries)}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <RotateCw size={13} />
                {loading ? 'Excluindo...' : 'Toda a série'}
              </button>
            </>
          ) : (
            <button
              onClick={() => handle(onDeleteOne)}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Entry Row (day-view + list-view) ────────────────────────────────────────
function EntryRow({ ev, onEdit, onDelete }) {
  const isAnnot = isAnnotation(ev);
  const isTask  = ev._isTask;
  const color   = isTask ? '#3B82F6' : isAnnot ? '#F59E0B' : (ev.color || '#6B7280');

  const badge = isTask
    ? <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ev.status === 'Finalizado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-600'}`}>Tarefa · {ev.status}</span>
    : isAnnot
    ? <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">Anotação</span>
    : <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize" style={{ background: color + '22', color }}>{ev.type}</span>;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 rounded-lg px-2 transition-colors">
      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold truncate">{ev.title}</span>
          {ev.recurrenceId && <RotateCw size={11} className="text-gray-400 flex-shrink-0" title="Recorrente" />}
          {badge}
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5 flex-wrap">
          <span>{fmtDate(ev.date)}</span>
          {ev.time && <span className="flex items-center gap-0.5"><Clock size={10} />{ev.time}</span>}
          {!isTask && !isAnnot && ev.durationMinutes > 0 && <span>{ev.durationMinutes}min</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14} /></button>
        <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

// ─── Calendar Chip ───────────────────────────────────────────────────────────
function CalendarChip({ ev, onClick }) {
  const isAnnot = isAnnotation(ev);
  const isTask  = ev._isTask;

  if (isTask) {
    const done = ev.status === 'Finalizado';
    return (
      <div onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`flex items-center gap-1 text-[10px] px-1.5 py-[3px] rounded-md mb-0.5 cursor-pointer font-medium border-l-2 transition-all hover:brightness-95 ${done ? 'bg-green-50 border-green-400 text-green-700' : 'bg-blue-50 border-blue-400 text-blue-700'}`}>
        <CheckSquare size={8} className={`flex-shrink-0 ${done ? 'text-green-500' : 'text-blue-400'}`} />
        <span className={`truncate leading-tight ${done ? 'line-through opacity-60' : ''}`}>{ev.title}</span>
      </div>
    );
  }

  if (isAnnot) {
    return (
      <div onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="flex items-center gap-1 text-[10px] px-1.5 py-[3px] rounded-md mb-0.5 cursor-pointer font-medium bg-amber-50 border-l-2 border-amber-400 text-amber-800 transition-all hover:brightness-95">
        <StickyNote size={8} className="text-amber-500 flex-shrink-0" />
        <span className="truncate leading-tight">{ev.title}</span>
      </div>
    );
  }

  // Regular event
  const color = ev.color || '#6B7280';
  return (
    <div onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex items-center gap-1 text-[10px] px-1.5 py-[3px] rounded-md mb-0.5 cursor-pointer font-medium transition-all hover:brightness-95"
      style={{ background: color + '22', borderLeft: `2px solid ${color}`, color }}>
      {ev.recurrenceId && <RotateCw size={7} className="flex-shrink-0 opacity-70" />}
      {ev.time && <span className="font-bold flex-shrink-0">{ev.time}</span>}
      <span className="truncate leading-tight text-gray-800">{ev.title}</span>
    </div>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [events, setEvents] = useState([]);
  const [tasks,  setTasks]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);        // null | 'newEvent' | 'newTask' | {event obj}
  const [viewMode, setViewMode] = useState('mes'); // 'dia' | 'mes' | 'ano'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userFilter, setUserFilter] = useState('');
  const [users, setUsers]       = useState([]);
  const [deals, setDeals]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [showRecManager, setShowRecManager] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();

  // Fetch users, deals and projects for dropdowns
  useEffect(() => {
    Promise.allSettled([
      api.get('/identity/users'),
      api.get('/commercial/deals'),
      api.get('/projects'),
    ]).then(([uRes, dRes, pRes]) => {
      if (uRes.status === 'fulfilled') setUsers(uRes.value.data || []);
      if (dRes.status === 'fulfilled') {
        const d = dRes.value.data;
        setDeals(Array.isArray(d) ? d : d?.items ?? []);
      }
      if (pRes.status === 'fulfilled') {
        const d = pRes.value.data;
        setProjects(Array.isArray(d) ? d : d?.items ?? []);
      }
    });
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let from, to;
      if (viewMode === 'dia') {
        from = to = currentDate.toISOString().slice(0, 10);
      } else if (viewMode === 'ano') {
        from = `${year}-01-01`;
        to = `${year}-12-31`;
      } else {
        from = new Date(year, month, 1).toISOString().slice(0, 10);
        to = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      }
      const [evRes, taskRes] = await Promise.allSettled([
        api.get(`/schedule/events?from=${from}&to=${to}`),
        api.get(`/tasks?dueFrom=${from}&dueTo=${to}`),
      ]);
      if (evRes.status === 'fulfilled') setEvents(evRes.value.data || []);
      if (taskRes.status === 'fulfilled') {
        // Normalize tasks so they look like calendar entries
        const raw = Array.isArray(taskRes.value.data) ? taskRes.value.data : taskRes.value.data?.items ?? [];
        setTasks(raw.map((t) => ({
          ...t,
          _isTask: true,
          date: t.due,
          type: 'task',
          color: '#3B82F6',
        })));
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [year, month, day, viewMode]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Navigation
  const prev = () => {
    if (viewMode === 'dia') setCurrentDate(new Date(year, month, day - 1));
    else if (viewMode === 'ano') setCurrentDate(new Date(year - 1, month, 1));
    else setCurrentDate(new Date(year, month - 1, 1));
  };
  const next = () => {
    if (viewMode === 'dia') setCurrentDate(new Date(year, month, day + 1));
    else if (viewMode === 'ano') setCurrentDate(new Date(year + 1, month, 1));
    else setCurrentDate(new Date(year, month + 1, 1));
  };
  const goToday = () => setCurrentDate(new Date());

  // Opens the confirm modal — actual delete is handled inside DeleteConfirmModal
  const handleDelete = (ev) => setDeleteTarget(ev);

  const execDeleteOne = async (ev) => {
    if (ev._isTask) await api.delete(`/tasks/${ev.id}`);
    else            await api.delete(`/schedule/events/${ev.id}`);
    setDeleteTarget(null);
    fetchEvents();
  };

  const execDeleteSeries = async (ev) => {
    await api.delete(`/schedule/events/series/${ev.recurrenceId}`);
    setDeleteTarget(null);
    fetchEvents();
  };

  // Merge events + tasks and apply user filter
  const allEntries = [...events, ...tasks];
  const filteredEvents = userFilter
    ? allEntries.filter((e) => String(e.userId) === userFilter || String(e.responsibleId) === userFilter)
    : allEntries;

  // ── Calendar grid (Mês) ──
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const todayStr = new Date().toISOString().slice(0, 10);

  const getEventsForDay = (d) => {
    if (!d) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return filteredEvents.filter((e) => e.date?.slice(0, 10) === dateStr);
  };

  // ── Header label ──
  const headerLabel = viewMode === 'dia'
    ? `${DAY_NAMES[currentDate.getDay()]}, ${day} de ${MONTH_NAMES[month]} de ${year}`
    : viewMode === 'ano'
    ? String(year)
    : `${MONTH_NAMES[month]} ${year}`;

  return (
    <div className="space-y-4">
      {/* ── Cabeçalho ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-extrabold text-erplus-text">Agenda</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowRecManager(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-erplus-border text-erplus-text rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
            <RotateCw size={15} className="text-blue-500" /> Recorrências
          </button>
          <button onClick={() => setModal('newAnnotation')}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-erplus-border text-erplus-text rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
            <StickyNote size={15} className="text-amber-500" /> Nova Anotação
          </button>
          <button onClick={() => setModal('newTask')}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-erplus-border text-erplus-text rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
            <CheckSquare size={15} className="text-erplus-accent" /> Nova Tarefa
          </button>
          <button onClick={() => setModal('newEvent')}
            className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-erplus-accent/90 transition">
            <Plus size={15} /> Novo Evento
          </button>
        </div>
      </div>

      {/* ── Barra de filtros ── */}
      <div className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3 flex-wrap">
        {/* View mode */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {[
            { id: 'dia', label: 'Dia', icon: CalendarDays },
            { id: 'mes', label: 'Mês', icon: Calendar },
            { id: 'ano', label: 'Ano', icon: LayoutList },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setViewMode(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === id ? 'bg-white text-erplus-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* Navegação */}
        <div className="flex items-center gap-1">
          <button onClick={prev} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><ChevronLeft size={16} /></button>
          <span className="text-sm font-bold text-erplus-text min-w-[160px] text-center">{headerLabel}</span>
          <button onClick={next} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><ChevronRight size={16} /></button>
        </div>

        <button onClick={goToday}
          className="px-3 py-1.5 text-xs font-semibold text-erplus-accent border border-erplus-accent/30 rounded-lg hover:bg-erplus-accent/5 transition">
          Hoje
        </button>

        {/* Filtro usuário */}
        <div className="ml-auto">
          <Select
            value={userFilter}
            onChange={(v) => setUserFilter(v)}
            options={[{ value: '', label: 'Todos os usuários' }, ...users.map((u) => ({ value: u.id, label: u.name }))]}
            size="sm"
          />
        </div>
      </div>

      {/* ── View: DIA ── */}
      {viewMode === 'dia' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4">
            {filteredEvents.filter(e => e.date?.slice(0, 10) === currentDate.toISOString().slice(0, 10)).length} evento(s)
          </h3>
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Carregando...</div>
          ) : filteredEvents.filter(e => e.date?.slice(0, 10) === currentDate.toISOString().slice(0, 10)).length === 0 ? (
            <div className="text-center py-10 text-gray-300">
              <Calendar size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum evento neste dia</p>
              <button onClick={() => setModal('newEvent')} className="mt-3 text-xs text-erplus-accent hover:underline">+ Adicionar evento</button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents
                .filter(e => e.date?.slice(0, 10) === currentDate.toISOString().slice(0, 10))
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                .map((ev) => <EntryRow key={`${ev._isTask ? 't' : 'e'}-${ev.id}`} ev={ev} onEdit={() => setModal(ev)} onDelete={() => handleDelete(ev)} />)}
            </div>
          )}
        </div>
      )}

      {/* ── View: MÊS ── */}
      {viewMode === 'mes' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-7">
            {DAY_NAMES.map((d) => (
              <div key={d} className="p-2 text-center text-xs font-bold text-gray-500 uppercase border-b border-gray-100 bg-gray-50">{d}</div>
            ))}
            {calendarDays.map((d, i) => {
              const dayEvents = getEventsForDay(d);
              const dateStr = d ? `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` : '';
              const isToday = dateStr === todayStr;
              return (
                <div key={i}
                  className={`min-h-[90px] border-b border-r border-gray-50 p-1 cursor-pointer hover:bg-gray-50/60 transition ${!d ? 'bg-gray-50/30' : ''}`}
                  onClick={() => { if (d) { setCurrentDate(new Date(year, month, d)); setViewMode('dia'); } }}>
                  {d && (
                    <>
                      <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-erplus-accent text-white' : 'text-gray-500'}`}>
                        {d}
                      </div>
                      {dayEvents.slice(0, 3).map((ev) => (
                        <CalendarChip key={`${ev._isTask ? 'task' : 'ev'}-${ev.id}`} ev={ev} onClick={() => setModal(ev)} />
                      ))}
                      {dayEvents.length > 3 && <div className="text-[10px] text-gray-400 pl-1">+{dayEvents.length - 3} mais</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── View: ANO ── */}
      {viewMode === 'ano' && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {MONTH_NAMES.map((name, mi) => {
            const monthEvents = filteredEvents.filter(e => {
              const d = e.date?.slice(0, 10);
              return d && d.startsWith(`${year}-${String(mi + 1).padStart(2, '0')}`);
            });
            const isCurrentMonth = mi === new Date().getMonth() && year === new Date().getFullYear();
            return (
              <div key={mi}
                onClick={() => { setCurrentDate(new Date(year, mi, 1)); setViewMode('mes'); }}
                className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all ${isCurrentMonth ? 'ring-2 ring-erplus-accent/40' : ''}`}>
                <div className={`text-sm font-bold mb-2 ${isCurrentMonth ? 'text-erplus-accent' : 'text-gray-700'}`}>{name}</div>
                <div className="text-2xl font-extrabold text-gray-700">{monthEvents.length}</div>
                <div className="text-xs text-gray-400 mt-0.5">evento{monthEvents.length !== 1 ? 's' : ''}</div>
                {monthEvents.slice(0, 2).map((ev) => (
                  <div key={ev.id} className="mt-1 text-[10px] px-1.5 py-0.5 rounded truncate font-medium text-white"
                    style={{ background: ev.color || '#6B7280' }}>
                    {ev.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Lista de eventos ── */}
      {viewMode !== 'dia' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Calendar size={14} />
            {viewMode === 'ano' ? `Todos os eventos de ${year}` : `Eventos de ${MONTH_NAMES[month]}`}
            <span className="text-gray-400 font-normal">({filteredEvents.length})</span>
          </h3>
          {filteredEvents.length === 0 ? (
            <p className="text-center py-6 text-gray-400 text-sm">Nenhum evento neste período</p>
          ) : (
            filteredEvents
              .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || ''))
              .map((ev) => <EntryRow key={`${ev._isTask ? 't' : 'e'}-${ev.id}`} ev={ev} onEdit={() => setModal(ev)} onDelete={() => handleDelete(ev)} />)
          )}
        </div>
      )}

      {/* ── Modais ── */}
      {modal === 'newEvent' && (
        <EventModal event={null} onClose={() => setModal(null)} onSaved={fetchEvents}
          users={users} deals={deals} projects={projects} />
      )}
      {modal === 'newTask' && (
        <TaskModal onClose={() => setModal(null)} onSaved={fetchEvents} users={users}
          deals={deals} projects={projects}
          selectedDate={currentDate.toISOString().slice(0, 10)} />
      )}
      {modal === 'newAnnotation' && (
        <AnnotationModal onClose={() => setModal(null)} onSaved={fetchEvents} users={users}
          deals={deals}
          selectedDate={currentDate.toISOString().slice(0, 10)} />
      )}
      {modal && modal !== 'newEvent' && modal !== 'newTask' && modal !== 'newAnnotation' && (
        <EventModal event={modal} onClose={() => setModal(null)} onSaved={fetchEvents}
          users={users} deals={deals} projects={projects} />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          entry={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleteOne={() => execDeleteOne(deleteTarget)}
          onDeleteSeries={() => execDeleteSeries(deleteTarget)}
        />
      )}

      {showRecManager && (
        <RecurrenceManagerModal
          onClose={() => setShowRecManager(false)}
          onChanged={fetchEvents}
        />
      )}
    </div>
  );
}
