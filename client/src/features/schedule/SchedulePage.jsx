import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Save, ChevronLeft, ChevronRight, Clock, Trash2, Edit, Calendar } from 'lucide-react';
import api from '../../services/api';

const TYPES = ['geral', 'comercial', 'producao'];
const TYPE_COLORS = { geral: '#10B981', comercial: '#C41E2A', producao: '#3B82F6' };
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function EventModal({ event, onClose, onSaved }) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    title: event?.title || '', date: event?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    time: event?.time || '09:00', durationMinutes: event?.durationMinutes || 60,
    type: event?.type || 'geral', color: event?.color || '#10B981', notes: event?.notes || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, durationMinutes: Number(form.durationMinutes) };
      if (isEdit) await api.put(`/schedule/events/${event.id}`, payload);
      else await api.post('/schedule/events', payload);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro'); } finally { setSaving(false); }
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
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Horário</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Duração (min)</label>
              <input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
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
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none" />
          </div>
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

export default function SchedulePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(year, month, 1).toISOString().slice(0, 10);
      const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      const { data } = await api.get(`/schedule/events?from=${from}&to=${to}`);
      setEvents(data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDelete = async (id) => {
    if (!confirm('Excluir evento?')) return;
    await api.delete(`/schedule/events/${id}`);
    fetchEvents();
  };

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.date?.slice(0, 10) === dateStr);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-erplus-text">Agenda</h1>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition">
          <Plus size={16} /> Novo Evento
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
        <h2 className="text-lg font-bold">{MONTH_NAMES[month]} {year}</h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-7">
          {DAY_NAMES.map((d) => (
            <div key={d} className="p-2 text-center text-xs font-bold text-gray-500 uppercase border-b border-gray-100 bg-gray-50">{d}</div>
          ))}
          {calendarDays.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day && `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` === todayStr;
            return (
              <div key={i} className={`min-h-[90px] border-b border-r border-gray-50 p-1 ${!day ? 'bg-gray-50/30' : ''}`}>
                {day && (
                  <>
                    <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-erplus-accent text-white' : 'text-gray-500'}`}>
                      {day}
                    </div>
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div key={ev.id} onClick={() => setModal(ev)}
                        className="text-[10px] px-1.5 py-0.5 rounded mb-0.5 truncate cursor-pointer font-medium text-white"
                        style={{ background: ev.color || '#6B7280' }}>
                        {ev.time && `${ev.time} `}{ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <div className="text-[10px] text-gray-400">+{dayEvents.length - 3} mais</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event list for current month */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Calendar size={14} /> Eventos do mês ({events.length})</h3>
        {events.length === 0 ? (
          <p className="text-center py-6 text-gray-400 text-sm">Nenhum evento neste mês</p>
        ) : events.map((ev) => (
          <div key={ev.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50">
            <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: ev.color || '#6B7280' }} />
            <div className="flex-1">
              <div className="text-sm font-semibold">{ev.title}</div>
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span>{new Date(ev.date).toLocaleDateString('pt-BR')}</span>
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
        ))}
      </div>

      {modal && <EventModal event={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={fetchEvents} />}
    </div>
  );
}
