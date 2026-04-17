import { useState, useEffect, useCallback } from 'react';
import { Calendar, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';

export default function PlanningPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const userId = user?.id;
      const now = new Date();
      const from = now.toISOString().slice(0, 10);
      const to = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const tasksUrl = userId ? `/tasks?responsibleId=${userId}` : '/tasks';
      const eventsUrl = userId
        ? `/schedule/events?from=${from}&to=${to}&responsibleId=${userId}`
        : `/schedule/events?from=${from}&to=${to}`;

      const [tRes, eRes] = await Promise.all([
        api.get(tasksUrl),
        api.get(eventsUrl),
      ]);

      setTasks(tRes.data.filter((t) => t.status !== 'Finalizado').sort((a, b) => {
        if (!a.due) return 1; if (!b.due) return -1;
        return new Date(a.due) - new Date(b.due);
      }));
      setEvents(eRes.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const today = new Date().toISOString().slice(0, 10);

  const statusColors = {
    'Não iniciado': 'text-gray-500', 'Em andamento': 'text-blue-600', 'Em revisão': 'text-amber-600',
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-erplus-text">Meus Planejamentos</h1>
        <p className="text-sm text-erplus-text-muted mt-1">Tarefas e eventos dos pr\u00f3ximos 30 dias</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-erplus-accent">{tasks.length}</div>
          <div className="text-xs text-gray-500 mt-1">Tarefas pendentes</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-red-500">{tasks.filter((t) => t.isOverdue).length}</div>
          <div className="text-xs text-gray-500 mt-1">Atrasadas</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-blue-500">{events.length}</div>
          <div className="text-xs text-gray-500 mt-1">Eventos pr\u00f3ximos</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-green-500">{tasks.filter((t) => t.due === today).length}</div>
          <div className="text-xs text-gray-500 mt-1">Vencem hoje</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Tarefas */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
            <CheckSquare size={15} className="text-erplus-accent" /> Minhas tarefas ({tasks.length})
          </h3>
          {tasks.length === 0 ? (
            <p className="text-center py-8 text-gray-300 text-sm">Nenhuma tarefa pendente</p>
          ) : tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.isOverdue ? 'bg-red-500' : 'bg-gray-300'}`} />
              <div className="flex-1">
                <div className="text-sm font-medium">{t.title}</div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className={statusColors[t.status] || 'text-gray-500'}>{t.status}</span>
                  {t.due && (
                    <span className={`flex items-center gap-1 ${t.isOverdue ? 'text-red-500 font-semibold' : ''}`}>
                      <Clock size={10} />{new Date(t.due).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Eventos */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
            <Calendar size={15} className="text-erplus-accent" /> Pr\u00f3ximos eventos ({events.length})
          </h3>
          {events.length === 0 ? (
            <p className="text-center py-8 text-gray-300 text-sm">Nenhum evento nos pr\u00f3ximos 30 dias</p>
          ) : events.map((e) => (
            <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50">
              <div className="w-1 h-9 rounded-full flex-shrink-0" style={{ background: e.color || '#6B7280' }} />
              <div className="flex-1">
                <div className="text-sm font-medium">{e.title}</div>
                <div className="text-xs text-gray-400">
                  {new Date(e.date).toLocaleDateString('pt-BR')} {e.time && `\u00e0s ${e.time}`} \u00b7 {e.durationMinutes}min
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{e.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
