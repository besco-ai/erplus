import { useState, useEffect, useCallback } from 'react';
import {
  Plus, X, Save, ChevronLeft, ChevronRight, Clock, Trash2,
  Edit, Calendar, CheckSquare, LayoutList, CalendarDays, StickyNote,
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';
import DatePicker from '../../components/ui/DatePicker';
import TimePicker from '../../components/ui/TimePicker';
import { fmtDate } from '../../utils/date';

const TYPES = ['geral', 'comercial', 'producao'];
const TYPE_COLORS = { geral: '#10B981', comercial: '#C41E2A', producao: '#3B82F6' };
const NOTE_TIPOS = ['Geral', 'Comercial', 'Produção', 'Reunião', 'Pessoal'];
const NOTE_COLOR = '#F59E0B'; // âmbar para anotações
const RECURRENCES = ['Sem recorrência', 'Diariamente', 'Semanalmente', 'Mensalmente'];
const VISIBILITIES = ['Compartilhada (todos)', 'Privada (só eu)'];

const isAnnotation = (ev) => ev?.type?.startsWith('anotacao');
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ─── Modal: Novo Evento ──────────────────────────────────────────────────────
function EventModal({ event, onClose, onSaved }) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    title: event?.title || '',
    date: event?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    time: event?.time || '09:00',
    durationMinutes: event?.durationMinutes || 60,
    type: event?.type || 'geral',
    color: event?.color || '#10B981',
    notes: event?.notes || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Título obrigatório'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, durationMinutes: Number(form.durationMinutes) };
      if (isEdit) await api.put(`/schedule/events/${event.id}`, payload);
      else await api.post('/schedule/events', payload);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? 'Editar Evento' : 'Novo Evento'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input value={form.title} onChange={(e) => f('title')(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data</label>
              <DatePicker value={form.date} onChange={(v) => f('date')(v)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Horário</label>
              <TimePicker value={form.time} onChange={(v) => f('time')(v)}
                className="w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Duração (min)</label>
              <input type="number" min={15} step={15} value={form.durationMinutes} onChange={(e) => f('durationMinutes')(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, color: TYPE_COLORS[e.target.value] || form.color })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm capitalize">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notas</label>
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
function AnnotationModal({ onClose, onSaved, users, selectedDate }) {
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
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Recorrência</label>
              <select value={form.recurrence} onChange={(e) => f('recurrence')(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                {RECURRENCES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {/* Vincular a + Responsável */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vincular a</label>
              <select value={form.dealId} onChange={(e) => f('dealId')(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                <option value="">— Nenhum —</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Responsável</label>
              <select value={form.responsibleId} onChange={(e) => f('responsibleId')(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                {users.length > 0
                  ? users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)
                  : <option value={currentUser?.id}>{currentUser?.name}</option>}
              </select>
            </div>
          </div>
          {/* Visibilidade + Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Visibilidade</label>
              <select value={form.visibility} onChange={(e) => f('visibility')(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                {VISIBILITIES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => f('tipo')(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                {NOTE_TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
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
function TaskModal({ onClose, onSaved, users, selectedDate }) {
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

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Título obrigatório'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/tasks', {
        title: form.title,
        description: form.description || null,
        responsibleId: Number(form.responsibleId),
        due: form.due || null,
        dealId: form.dealId ? Number(form.dealId) : null,
        projectId: form.projectId ? Number(form.projectId) : null,
        category: null,
      });
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
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Recorrência</label>
              <select value={form.recurrence} onChange={(e) => f('recurrence')(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                {RECURRENCES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {/* Vincular a + Responsável */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vincular a</label>
              <select value={form.dealId || ''} onChange={(e) => f('dealId')(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                <option value="">— Nenhum —</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Responsável</label>
              <select value={form.responsibleId} onChange={(e) => f('responsibleId')(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                {users.length > 0
                  ? users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)
                  : <option value={currentUser?.id}>{currentUser?.name}</option>
                }
              </select>
            </div>
          </div>
          {/* Visibilidade */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Visibilidade</label>
            <select value={form.visibility} onChange={(e) => f('visibility')(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
              {VISIBILITIES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
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

// ─── Página Principal ────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);        // null | 'newEvent' | 'newTask' | {event obj}
  const [viewMode, setViewMode] = useState('mes'); // 'dia' | 'mes' | 'ano'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userFilter, setUserFilter] = useState('');
  const [users, setUsers] = useState([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();

  // Fetch users for filter + responsável
  useEffect(() => {
    api.get('/identity/users').then(({ data }) => setUsers(data)).catch(() => {});
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
      const { data } = await api.get(`/schedule/events?from=${from}&to=${to}`);
      setEvents(data);
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

  const handleDelete = async (id) => {
    if (!confirm('Excluir evento?')) return;
    await api.delete(`/schedule/events/${id}`);
    fetchEvents();
  };

  // Filtered events
  const filteredEvents = userFilter
    ? events.filter((e) => String(e.userId) === userFilter || String(e.responsibleId) === userFilter)
    : events;

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
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}
            className="px-3 py-1.5 border border-erplus-border rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-erplus-accent/20">
            <option value="">Todos os usuários</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
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
                .map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: ev.color || '#6B7280' }} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{ev.title}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                        {ev.time && <span><Clock size={10} className="inline mr-1" />{ev.time}</span>}
                        <span>{ev.durationMinutes}min</span>
                        <span className="capitalize">{ev.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal(ev)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(ev.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
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
                        <div key={ev.id}
                          onClick={(e) => { e.stopPropagation(); setModal(ev); }}
                          className={`text-[10px] px-1.5 py-0.5 rounded mb-0.5 truncate cursor-pointer font-medium hover:opacity-90 flex items-center gap-0.5 ${isAnnotation(ev) ? 'text-amber-800 bg-amber-100 border border-amber-200' : 'text-white'}`}
                          style={isAnnotation(ev) ? {} : { background: ev.color || '#6B7280' }}>
                          {isAnnotation(ev) && '📝 '}{ev.time && !isAnnotation(ev) && `${ev.time} `}{ev.title}
                        </div>
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
            filteredEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: ev.color || '#6B7280' }} />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{ev.title}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    <span>{fmtDate(ev.date)}</span>
                    {ev.time && <span><Clock size={10} className="inline" /> {ev.time}</span>}
                    <span>{ev.durationMinutes}min</span>
                    <span className="capitalize">{ev.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setModal(ev)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(ev.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Modais ── */}
      {modal === 'newEvent' && (
        <EventModal event={null} onClose={() => setModal(null)} onSaved={fetchEvents} />
      )}
      {modal === 'newTask' && (
        <TaskModal onClose={() => setModal(null)} onSaved={fetchEvents} users={users}
          selectedDate={currentDate.toISOString().slice(0, 10)} />
      )}
      {modal === 'newAnnotation' && (
        <AnnotationModal onClose={() => setModal(null)} onSaved={fetchEvents} users={users}
          selectedDate={currentDate.toISOString().slice(0, 10)} />
      )}
      {modal && modal !== 'newEvent' && modal !== 'newTask' && modal !== 'newAnnotation' && (
        <EventModal event={modal} onClose={() => setModal(null)} onSaved={fetchEvents} />
      )}
    </div>
  );
}
