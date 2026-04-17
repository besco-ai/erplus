import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit, Trash2, X, Save, Phone, Mail, Building,
  MapPin, User, Users, ChevronRight, MessageSquare, Filter,
} from 'lucide-react';
import api from '../../services/api';

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const TYPES = ['Lead', 'Cliente', 'Fornecedor', 'Relacionamento'];
const PERSON_TYPES = ['PF', 'PJ'];

const typeBadge = (type) => {
  const colors = {
    Lead: 'bg-amber-50 text-amber-700',
    Cliente: 'bg-green-50 text-green-700',
    Fornecedor: 'bg-blue-50 text-blue-700',
    Relacionamento: 'bg-purple-50 text-purple-700',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[type] || 'bg-gray-100 text-gray-600'}`}>{type}</span>;
};

function ContactModal({ contact, contacts, onClose, onSaved }) {
  const isEdit = !!contact;
  const [form, setForm] = useState({
    type: contact?.type || 'Lead',
    personType: contact?.personType || 'PJ',
    name: contact?.name || '',
    company: contact?.company || '',
    cnpj: contact?.cnpj || '',
    cpf: contact?.cpf || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
    city: contact?.city || '',
    state: contact?.state || '',
    status: contact?.status || 'Ativo',
    linkedToId: contact?.linkedToId || '',
    position: contact?.position || '',
    birthday: contact?.birthday || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const pjContacts = contacts.filter((c) => c.personType === 'PJ' && c.id !== contact?.id);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, linkedToId: form.linkedToId ? Number(form.linkedToId) : null };
      if (isEdit) {
        await api.put(`/crm/contacts/${contact.id}`, payload);
      } else {
        await api.post('/crm/contacts', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, value, onChange, type = 'text', options, span = 1, placeholder }) => (
    <div className={`${span === 2 ? 'col-span-2' : ''}`}>
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
      {options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500">
          {options.map((o) => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500" />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? 'Editar Contato' : 'Novo Contato'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo" value={form.type} onChange={(v) => set('type', v)} options={TYPES} />
          <Field label="Pessoa" value={form.personType} onChange={(v) => set('personType', v)} options={PERSON_TYPES} />
          <Field label="Nome *" value={form.name} onChange={(v) => set('name', v)} span={2} />
          {form.personType === 'PJ' && (
            <>
              <Field label="Razão Social" value={form.company} onChange={(v) => set('company', v)} />
              <Field label="CNPJ" value={form.cnpj} onChange={(v) => set('cnpj', v)} placeholder="00.000.000/0000-00" />
            </>
          )}
          {form.personType === 'PF' && (
            <>
              <Field label="CPF" value={form.cpf} onChange={(v) => set('cpf', v)} placeholder="000.000.000-00" />
              <Field label="Cargo" value={form.position} onChange={(v) => set('position', v)} />
              <Field label="Aniversário" value={form.birthday} onChange={(v) => set('birthday', v)} type="date" />
              <Field label="Vinculado a (PJ)" value={form.linkedToId}
                onChange={(v) => set('linkedToId', v)}
                options={[{ value: '', label: '— Nenhum —' }, ...pjContacts.map((c) => ({ value: c.id, label: c.name }))]} />
            </>
          )}
          <Field label="Telefone" value={form.phone} onChange={(v) => set('phone', v)} placeholder="(00) 0000-0000" />
          <Field label="E-mail" value={form.email} onChange={(v) => set('email', v)} type="email" />
          <Field label="Cidade" value={form.city} onChange={(v) => set('city', v)} />
          <Field label="UF" value={form.state} onChange={(v) => set('state', v)} options={[{ value: '', label: '—' }, ...UFS.map((u) => ({ value: u, label: u }))]} />
          <Field label="Status" value={form.status} onChange={(v) => set('status', v)} options={['Ativo', 'Inativo', 'Novo']} />
        </div>

        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactDetail({ contact, onClose, onUpdated }) {
  const [obsTitle, setObsTitle] = useState('');
  const [obsContent, setObsContent] = useState('');

  const addObs = async () => {
    if (!obsTitle.trim()) return;
    try {
      await api.post(`/crm/contacts/${contact.id}/observations`, { title: obsTitle, content: obsContent });
      setObsTitle('');
      setObsContent('');
      onUpdated();
    } catch { /* silent */ }
  };

  const deleteObs = async (obsId) => {
    if (!confirm('Excluir observação?')) return;
    try {
      await api.delete(`/crm/contacts/${contact.id}/observations/${obsId}`);
      onUpdated();
    } catch { /* silent */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">{contact.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {typeBadge(contact.type)}
              <span className="text-xs text-gray-400">{contact.personType}</span>
              {contact.linkedToName && <span className="text-xs text-gray-400">· vinculado a {contact.linkedToName}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {contact.company && <div className="flex items-center gap-2 text-sm text-gray-600"><Building size={14} className="text-gray-400" />{contact.company}</div>}
          {contact.phone && <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={14} className="text-gray-400" />{contact.phone}</div>}
          {contact.email && <div className="flex items-center gap-2 text-sm text-gray-600"><Mail size={14} className="text-gray-400" />{contact.email}</div>}
          {contact.city && <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin size={14} className="text-gray-400" />{contact.city}{contact.state ? `/${contact.state}` : ''}</div>}
          {contact.position && <div className="flex items-center gap-2 text-sm text-gray-600"><User size={14} className="text-gray-400" />{contact.position}</div>}
          {(contact.cnpj || contact.cpf) && <div className="text-sm text-gray-400">{contact.cnpj || contact.cpf}</div>}
        </div>

        {/* Linked contacts */}
        {contact.linkedContacts?.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Users size={14} /> Contatos Vinculados</h4>
            {contact.linkedContacts.map((lc) => (
              <div key={lc.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                <div className="w-8 h-8 rounded-full bg-erplus-accent text-white flex items-center justify-center text-xs font-bold">
                  {lc.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{lc.name}</div>
                  <div className="text-xs text-gray-400">{lc.position} · {lc.phone}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Observations */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><MessageSquare size={14} /> Observações ({contact.observations?.length || 0})</h4>
          {contact.observations?.map((obs) => (
            <div key={obs.id} className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{obs.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{new Date(obs.date).toLocaleDateString('pt-BR')}</span>
                  <button onClick={() => deleteObs(obs.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                </div>
              </div>
              <p className="text-sm text-gray-600">{obs.content}</p>
            </div>
          ))}

          {/* Add observation */}
          <div className="mt-3 space-y-2">
            <input value={obsTitle} onChange={(e) => setObsTitle(e.target.value)} placeholder="Título da observação..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <textarea value={obsContent} onChange={(e) => setObsContent(e.target.value)} placeholder="Conteúdo..." rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" />
            <button onClick={addObs} disabled={!obsTitle.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg hover:bg-red-700 disabled:opacity-40 flex items-center gap-2">
              <Plus size={14} /> Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPerson, setFilterPerson] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState(null); // null | 'new' | contact
  const [detail, setDetail] = useState(null); // null | contactDetail

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterType) params.set('type', filterType);
      if (filterPerson) params.set('personType', filterPerson);
      const { data } = await api.get(`/crm/contacts?${params}`);
      setContacts(data.items || data);
      setTotalCount(data.totalCount || (data.items || data).length);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [search, filterType, filterPerson]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const openDetail = async (id) => {
    try {
      const { data } = await api.get(`/crm/contacts/${id}`);
      setDetail(data);
    } catch { /* silent */ }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Excluir ${name}?`)) return;
    try {
      await api.delete(`/crm/contacts/${id}`);
      fetchContacts();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-erplus-text">Contatos</h1>
          <p className="text-sm text-erplus-text-muted mt-1">{totalCount} contato(s)</p>
        </div>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition">
          <Plus size={16} /> Novo Contato
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, empresa, e-mail, telefone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition ${showFilters ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
          <Filter size={14} /> Filtros
        </button>
      </div>

      {showFilters && (
        <div className="flex gap-3 p-3 bg-white rounded-lg border border-gray-100">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Todos os tipos</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">PF e PJ</option>
            {PERSON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => { setFilterType(''); setFilterPerson(''); }} className="text-xs text-gray-400 hover:text-red-500">Limpar</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Contato</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Tipo</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Telefone</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Cidade/UF</th>
              <th className="text-center px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Carregando...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhum contato encontrado</td></tr>
            ) : contacts.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition cursor-pointer" onClick={() => openDetail(c.id)}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-erplus-accent text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {c.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-400">
                        {c.personType}{c.company ? ` · ${c.company}` : ''}{c.linkedToName ? ` · ${c.linkedToName}` : ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">{typeBadge(c.type)}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{c.phone || '—'}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{c.city ? `${c.city}/${c.state}` : '—'}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.status === 'Ativo' ? 'bg-green-50 text-green-600' : c.status === 'Novo' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setModal(c)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal && <ContactModal contact={modal === 'new' ? null : modal} contacts={contacts} onClose={() => setModal(null)} onSaved={fetchContacts} />}
      {detail && <ContactDetail contact={detail} onClose={() => setDetail(null)} onUpdated={() => openDetail(detail.id)} />}
    </div>
  );
}
