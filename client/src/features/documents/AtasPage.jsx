import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Save, FileText, Trash2, ExternalLink, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import { fmtDate } from '../../utils/date';
import Select from '../../components/ui/Select';

function AtaModal({ deals, onClose, onSaved }) {
  const [form, setForm] = useState({
    dealId: deals[0]?.id || '', title: '', content: '', linksJson: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await api.post(`/commercial/deals/${form.dealId}/atas`, {
        title: form.title, content: form.content,
        linksJson: form.linksJson ? JSON.stringify(form.linksJson.split('\n').filter(Boolean)) : null,
      });
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Erro'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Nova Ata de Reunião</h3>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Negócio vinculado *</label>
            <Select
              value={form.dealId}
              onChange={(v) => setForm({ ...form, dealId: v })}
              options={deals.map((d) => ({ value: d.id, label: d.title || `Deal #${d.id}` }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Conteúdo</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none"
              placeholder="Registre os pontos discutidos, decisões tomadas e próximos passos..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Links (um por linha)</label>
            <textarea value={form.linksJson} onChange={(e) => setForm({ ...form, linksJson: e.target.value })} rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none"
              placeholder="https://drive.google.com/..." />
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

function AtaCard({ ata, dealTitle, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  let links = [];
  try { links = ata.linksJson ? JSON.parse(ata.linksJson) : []; } catch { /* silent */ }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold">{ata.title}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">{dealTitle}</span>
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Calendar size={10} />
            {fmtDate(ata.date)}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={() => onDelete(ata)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{ata.content}</p>
          {links.length > 0 && (
            <div className="mt-3 space-y-1">
              {links.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700">
                  <ExternalLink size={10} />{link.length > 60 ? link.slice(0, 60) + '...' : link}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AtasPage() {
  const [atas, setAtas] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: dealsList } = await api.get('/commercial/deals');
      setDeals(dealsList);

      const allAtas = [];
      for (const deal of dealsList) {
        try {
          const { data: detail } = await api.get(`/commercial/deals/${deal.id}`);
          if (detail.atas?.length > 0) {
            allAtas.push(...detail.atas.map((a) => ({ ...a, dealTitle: deal.title || `Deal #${deal.id}` })));
          }
        } catch { /* silent */ }
      }
      allAtas.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAtas(allAtas);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (ata) => {
    if (!confirm(`Excluir ata "${ata.title}"?`)) return;
    try {
      await api.delete(`/commercial/deals/${ata.dealId}/atas/${ata.id}`);
      fetchData();
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-erplus-text">Atas de Reuniões</h1>
          <p className="text-sm text-erplus-text-muted mt-1">{atas.length} ata(s) registrada(s)</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          <Plus size={16} /> Nova Ata
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : atas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <FileText size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Nenhuma ata registrada</p>
        </div>
      ) : (
        atas.map((ata) => (
          <AtaCard key={`${ata.dealId}-${ata.id}`} ata={ata} dealTitle={ata.dealTitle} onDelete={handleDelete} />
        ))
      )}

      {modal && <AtaModal deals={deals} onClose={() => setModal(false)} onSaved={fetchData} />}
    </div>
  );
}
