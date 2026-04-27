import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Save, HelpCircle, Trash2, MessageSquare, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import { fmtDate } from '../../utils/date';
import Select from '../../components/ui/Select';

const CATEGORIES = ['Geral', 'Bug', 'Melhoria', 'Dúvida'];
const PRIORITIES = ['Baixa', 'Normal', 'Alta', 'Urgente'];
const STATUSES = ['Aberto', 'Em andamento', 'Resolvido', 'Fechado'];

const priorityColors = {
  Baixa: 'bg-gray-100 text-gray-600', Normal: 'bg-blue-50 text-blue-600',
  Alta: 'bg-amber-50 text-amber-600', Urgente: 'bg-red-50 text-red-600',
};
const statusIcons = {
  Aberto: <AlertCircle size={14} className="text-blue-500" />,
  'Em andamento': <Clock size={14} className="text-amber-500" />,
  Resolvido: <CheckCircle size={14} className="text-green-500" />,
  Fechado: <CheckCircle size={14} className="text-gray-400" />,
};

function TicketModal({ ticket, onClose, onSaved }) {
  const isEdit = !!ticket;
  const [form, setForm] = useState({
    title: ticket?.title || '', description: ticket?.description || '',
    category: ticket?.category || 'Geral', priority: ticket?.priority || 'Normal',
    status: ticket?.status || 'Aberto', resolution: ticket?.resolution || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await api.put(`/documents/tickets/${ticket.id}`, {
          title: form.title, status: form.status, priority: form.priority, resolution: form.resolution || null,
        });
      } else {
        await api.post('/documents/tickets', { title: form.title, description: form.description, category: form.category, priority: form.priority });
      }
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? 'Editar Ticket' : 'Novo Ticket'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descrição</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none"
                placeholder="Descreva o problema ou solicitação em detalhes..." />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Categoria</label>
                <Select
                  value={form.category}
                  onChange={(v) => setForm({ ...form, category: v })}
                  options={CATEGORIES}
                  className="w-full"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prioridade</label>
              <Select
                value={form.priority}
                onChange={(v) => setForm({ ...form, priority: v })}
                options={PRIORITIES}
                className="w-full"
              />
            </div>
            {isEdit && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                <Select
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                  options={STATUSES}
                  className="w-full"
                />
              </div>
            )}
          </div>
          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Resolução</label>
              <textarea value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none"
                placeholder="Descreva como o ticket foi resolvido..." />
            </div>
          )}
        </div>
        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 flex items-center gap-2">
            <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/documents/tickets'); setTickets(data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleDelete = async (id) => {
    if (!confirm('Excluir ticket?')) return;
    await api.delete(`/documents/tickets/${id}`); fetchTickets();
  };

  const filtered = filterStatus ? tickets.filter((t) => t.status === filterStatus) : tickets;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-erplus-text flex items-center gap-2"><HelpCircle size={20} /> Suporte</h1>
          <p className="text-sm text-erplus-text-muted mt-1">{tickets.length} ticket(s)</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          <Plus size={16} /> Novo Ticket
        </button>
      </div>

      <div className="flex gap-2">
        {['', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatus === s ? 'bg-erplus-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s || 'Todos'}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <MessageSquare size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Nenhum ticket</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {statusIcons[t.status]}
                    <span className="text-sm font-bold">{t.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${priorityColors[t.priority]}`}>{t.priority}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">{t.category}</span>
                  </div>
                  {t.description && <p className="text-sm text-gray-600 mt-1">{t.description}</p>}
                  {t.resolution && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                      <strong>Resolução:</strong> {t.resolution}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-2">{fmtDate(t.createdAt)} {t.resolvedAt && `· Resolvido em ${fmtDate(t.resolvedAt)}`}</div>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button onClick={() => setModal(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><MessageSquare size={14} /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <TicketModal ticket={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={fetchTickets} />}
    </div>
  );
}
