import { useState, useEffect, useCallback } from 'react';
import {
  Plus, X, Save, CheckSquare, Clock, AlertCircle,
  Edit, Trash2, ChevronRight, User,
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';

const STATUSES = ['Não iniciado', 'Em andamento', 'Em revisão', 'Finalizado'];
const statusColors = {
  'Não iniciado': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' },
  'Em andamento': { bg: 'bg-blue-50/50', border: 'border-blue-200', text: 'text-blue-600', dot: 'bg-blue-500' },
  'Em revisão': { bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-600', dot: 'bg-amber-500' },
  'Finalizado': { bg: 'bg-green-50/50', border: 'border-green-200', text: 'text-green-600', dot: 'bg-green-500' },
};

function TaskCard({ task, onClick }) {
  const colors = statusColors[task.status] || statusColors['Não iniciado'];
  return (
    <div onClick={() => onClick(task)}
      className="bg-white rounded-lg border border-gray-100 p-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all mb-2">
      <div className="text-sm font-semibold text-gray-900 mb-1">{task.title}</div>
      {task.description && <div className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</div>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.due && (
            <span className={`text-xs font-medium flex items-center gap-1 ${task.isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
              <Clock size={10} />
              {new Date(task.due).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
        <div className="w-6 h-6 rounded-full bg-erplus-accent text-white flex items-center justify-center text-[9px] font-bold">
          {task.responsibleId}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ status, tasks, onTaskClick, onDrop }) {
  const [dragOver, setDragOver] = useState(false);
  const colors = statusColors[status];
  const columnTasks = tasks.filter((t) => t.status === status);

  return (
    <div
      className={`flex-1 min-w-[220px] flex flex-col rounded-xl transition ${dragOver ? 'bg-red-50/50' : colors.bg}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const id = e.dataTransfer.getData('taskId'); if (id) onDrop(Number(id), status); }}>
      <div className="px-3 py-3 border-b border-gray-200/50">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
          <span className="text-sm font-bold text-gray-700">{status}</span>
          <span className="text-xs font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full ml-auto">
            {columnTasks.length}
          </span>
        </div>
      </div>
      <div className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-320px)]">
        {columnTasks.map((task) => (
          <div key={task.id} draggable onDragStart={(e) => e.dataTransfer.setData('taskId', task.id.toString())}>
            <TaskCard task={task} onClick={onTaskClick} />
          </div>
        ))}
        {columnTasks.length === 0 && <div className="text-center py-8 text-xs text-gray-300">Arraste aqui</div>}
      </div>
    </div>
  );
}

function TaskModal({ task, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'Não iniciado',
    responsibleId: task?.responsibleId || 1,
    due: task?.due?.slice(0, 10) || '',
    category: task?.category || '',
  });
  const [subtasks, setSubtasks] = useState(() => {
    try { return task?.subtasksJson ? JSON.parse(task.subtasksJson) : []; } catch { return []; }
  });
  const [newSub, setNewSub] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const addSub = () => {
    if (!newSub.trim()) return;
    setSubtasks([...subtasks, { title: newSub.trim(), done: false }]);
    setNewSub('');
  };

  const toggleSub = (idx) => {
    setSubtasks(subtasks.map((s, i) => i === idx ? { ...s, done: !s.done } : s));
  };

  const removeSub = (idx) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        responsibleId: Number(form.responsibleId),
        due: form.due || null,
        subtasksJson: subtasks.length > 0 ? JSON.stringify(subtasks) : null,
      };
      if (isEdit) await api.put(`/tasks/${task.id}`, payload);
      else await api.post('/tasks', payload);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Excluir esta tarefa?')) return;
    await api.delete(`/tasks/${task.id}`);
    onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prazo</label>
              <input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>

          {/* Subtasks */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Subtarefas ({subtasks.filter((s) => s.done).length}/{subtasks.length})
              </span>
            </div>
            {subtasks.map((sub, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1.5 border-b border-gray-50">
                <button onClick={() => toggleSub(idx)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${sub.done ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                  {sub.done && <CheckSquare size={12} className="text-white" />}
                </button>
                <span className={`flex-1 text-sm ${sub.done ? 'line-through text-gray-400' : ''}`}>{sub.title}</span>
                <button onClick={() => removeSub(idx)} className="text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Nova subtarefa..."
                onKeyDown={(e) => { if (e.key === 'Enter') addSub(); }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <button onClick={addSub} className="px-3 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="flex justify-between mt-6">
          {isEdit && (
            <button onClick={handleDelete} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1">
              <Trash2 size={12} /> Excluir
            </button>
          )}
          <div className={`flex gap-2 ${!isEdit ? 'ml-auto' : ''}`}>
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
              <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage({ mine = false }) {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const { user } = useAuthStore();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const userFilter = mine && user?.id ? `?responsibleId=${user.id}` : '';
      const [tRes, sRes] = await Promise.all([
        api.get(`/tasks${userFilter}`),
        api.get(`/tasks/summary${userFilter}`),
      ]);
      setTasks(tRes.data);
      setSummary(sRes.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [mine, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDrop = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchData();
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-erplus-text">Tarefas</h1>
          {summary && (
            <p className="text-sm text-erplus-text-muted mt-1">
              {summary.total} tarefa(s) · {summary.atrasadas > 0 && <span className="text-red-500 font-semibold">{summary.atrasadas} atrasada(s)</span>}
            </p>
          )}
        </div>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition">
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: summary.total, color: 'text-gray-700' },
            { label: 'Não iniciado', value: summary.naoIniciado, color: 'text-gray-500' },
            { label: 'Em andamento', value: summary.emAndamento, color: 'text-blue-600' },
            { label: 'Em revisão', value: summary.emRevisao, color: 'text-amber-600' },
            { label: 'Atrasadas', value: summary.atrasadas, color: summary.atrasadas > 0 ? 'text-red-600' : 'text-gray-400' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-3 text-center">
              <div className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasks}
              onTaskClick={(t) => setModal(t)}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      {modal && (
        <TaskModal
          task={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
