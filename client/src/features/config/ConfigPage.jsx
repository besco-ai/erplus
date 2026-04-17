import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Save, Edit, Trash2, Settings } from 'lucide-react';
import api from '../../services/api';

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

function ServiceModal({ service, onClose, onSaved }) {
  const isEdit = !!service;
  const [form, setForm] = useState({
    name: service?.name || '', category: service?.category || '',
    unit: service?.unit || '', price: service?.price || '',
    description: service?.description || '', status: service?.status || 'Ativo',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, price: Number(form.price) };
      if (isEdit) await api.put(`/config/services/${service.id}`, payload);
      else await api.post('/config/services', payload);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? 'Editar Serviço' : 'Novo Serviço'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Categoria</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Consultoria" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Unidade</label>
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Ex: por projeto" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Preço</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
              <option value="Ativo">Ativo</option><option value="Inativo">Inativo</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descrição</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
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

export default function ConfigPage() {
  const [tab, setTab] = useState('servicos');
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, stRes] = await Promise.all([api.get('/config/services'), api.get('/config/settings')]);
      setServices(sRes.data);
      setSettings(stRes.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deleteService = async (id) => {
    if (!confirm('Excluir serviço?')) return;
    await api.delete(`/config/services/${id}`);
    fetchData();
  };

  const tabs = [
    { id: 'servicos', label: `Serviços (${services.length})` },
    { id: 'empresa', label: 'Empresa' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-erplus-text flex items-center gap-2"><Settings size={20} /> Configurações</h1>
        {tab === 'servicos' && (
          <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700">
            <Plus size={16} /> Novo Serviço
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.id ? 'bg-white text-erplus-accent shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : tab === 'servicos' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Serviço</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Categoria</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Unidade</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Preço</th>
                <th className="text-center px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="text-sm font-semibold">{s.name}</div>
                    {s.description && <div className="text-xs text-gray-400">{s.description}</div>}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{s.category || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{s.unit || '—'}</td>
                  <td className="px-5 py-3 text-sm font-bold text-erplus-accent text-right">{R$(s.price)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.status === 'Ativo' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{s.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(s)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                      <button onClick={() => deleteService(s.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Dados da Empresa</h3>
          <div className="space-y-3 text-sm text-gray-600">
            {settings.length === 0 ? <p className="text-gray-400">Nenhuma configuração salva</p> :
              settings.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="font-medium text-gray-700">{s.key}</span>
                  <span>{s.value}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {modal && <ServiceModal service={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={fetchData} />}
    </div>
  );
}
