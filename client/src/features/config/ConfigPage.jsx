import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, X, Save, Edit, Trash2, Settings, ExternalLink,
} from 'lucide-react';
import api from '../../services/api';

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

// ═══════════ Modal genérico simples ═══════════

function SimpleFormModal({ title, fields, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(() => {
    const o = {};
    for (const f of fields) o[f.key] = initial?.[f.key] ?? f.default ?? '';
    return o;
  });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true); setErr('');
    try {
      await onSubmit(form);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                {f.label} {f.required && '*'}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none"
                />
              ) : f.type === 'select' ? (
                <select
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                >
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  type={f.type || 'text'}
                  step={f.type === 'number' ? '0.01' : undefined}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                />
              )}
            </div>
          ))}
        </div>
        {err && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{err}</div>}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg">Cancelar</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 flex items-center gap-2">
            <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════ Abas ═══════════

function ServicesTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/config/services');
      setItems(r.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (id) => {
    if (!confirm('Excluir?')) return;
    await api.delete(`/config/services/${id}`);
    fetch();
  };

  const save = async (form) => {
    const payload = { ...form, price: Number(form.price || 0) };
    if (modal && modal !== 'new') await api.put(`/config/services/${modal.id}`, payload);
    else await api.post('/config/services', payload);
    fetch();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Catálogo de serviços usados em orçamentos e contratos</p>
        <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          <Plus size={16} /> Novo Serviço
        </button>
      </div>
      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
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
              {items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhum serviço cadastrado</td></tr>
              ) : items.map((s) => (
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
                      <button onClick={() => remove(s.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <SimpleFormModal
          title={modal === 'new' ? 'Novo Serviço' : 'Editar Serviço'}
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'category', label: 'Categoria', placeholder: 'Ex: Consultoria' },
            { key: 'unit', label: 'Unidade', placeholder: 'Ex: por projeto' },
            { key: 'price', label: 'Preço', type: 'number' },
            { key: 'description', label: 'Descrição', type: 'textarea' },
            { key: 'status', label: 'Status', type: 'select', default: 'Ativo',
              options: [{ value: 'Ativo', label: 'Ativo' }, { value: 'Inativo', label: 'Inativo' }] },
          ]}
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSubmit={save}
        />
      )}
    </>
  );
}

function ContactTypesTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/crm/contact-types');
      setItems(r.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const save = async (form) => {
    await api.post('/crm/contact-types', form);
    fetch();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Categorias que um contato pode ter (Cliente, Lead, Fornecedor, etc)</p>
        <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          <Plus size={16} /> Novo Tipo
        </button>
      </div>
      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
        <SimpleList
          items={items}
          columns={[
            { key: 'name', label: 'Nome' },
            { key: 'description', label: 'Descrição', fallback: '—' },
          ]}
          emptyLabel="Nenhum tipo cadastrado"
        />
      )}
      {modal && (
        <SimpleFormModal
          title="Novo Tipo de Contato"
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'description', label: 'Descrição', type: 'textarea' },
          ]}
          onClose={() => setModal(null)}
          onSubmit={save}
        />
      )}
    </>
  );
}

function BusinessTypesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/commercial/business-types');
        setItems(r.data);
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">Tipos de negócio (visualização — edição via API)</p>
      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
        <SimpleList
          items={items}
          columns={[
            { key: 'name', label: 'Nome' },
            { key: 'description', label: 'Descrição', fallback: '—' },
          ]}
          emptyLabel="Nenhum tipo cadastrado"
        />
      )}
    </>
  );
}

function CostCentersTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/finance/cost-centers');
      setItems(r.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const save = async (form) => {
    await api.post('/finance/cost-centers', form);
    fetch();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Classificação de lançamentos financeiros</p>
        <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          <Plus size={16} /> Novo Centro
        </button>
      </div>
      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
        <SimpleList
          items={items}
          columns={[
            { key: 'name', label: 'Nome' },
            { key: 'type', label: 'Tipo', badge: { Receita: 'bg-green-50 text-green-600', Despesa: 'bg-red-50 text-red-600' } },
            { key: 'category', label: 'Categoria', fallback: '—' },
            { key: 'description', label: 'Descrição', fallback: '—' },
          ]}
          emptyLabel="Nenhum centro de custo"
        />
      )}
      {modal && (
        <SimpleFormModal
          title="Novo Centro de Custo"
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'type', label: 'Tipo', type: 'select', default: 'Despesa',
              options: [{ value: 'Receita', label: 'Receita' }, { value: 'Despesa', label: 'Despesa' }] },
            { key: 'category', label: 'Categoria', placeholder: 'Ex: Administrativo' },
            { key: 'description', label: 'Descrição', type: 'textarea' },
          ]}
          onClose={() => setModal(null)}
          onSubmit={save}
        />
      )}
    </>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/identity/users');
        setUsers(r.data);
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Usuários cadastrados no sistema</p>
        <Link to="/equipe" className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          <ExternalLink size={14} /> Gerenciar equipe
        </Link>
      </div>
      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
        <SimpleList
          items={users}
          columns={[
            { key: 'name', label: 'Nome' },
            { key: 'email', label: 'E-mail' },
            { key: 'role', label: 'Perfil', badge: {
              'Operador Master': 'bg-red-50 text-red-600',
              'Colaborador': 'bg-blue-50 text-blue-600',
              'Visitante': 'bg-gray-100 text-gray-600',
            } },
            { key: 'isActive', label: 'Ativo', render: (v) => v ? 'Sim' : 'Não' },
          ]}
          emptyLabel="Nenhum usuário"
        />
      )}
    </>
  );
}

function AutomationsTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/automation/rules');
      setItems(r.data);
    } catch { setItems([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (id) => {
    if (!confirm('Excluir esta automação?')) return;
    await api.delete(`/automation/rules/${id}`);
    fetch();
  };

  const save = async (form) => {
    const payload = {
      ...form,
      active: form.active === 'true' || form.active === true,
      triggerStageId: form.triggerStageId ? Number(form.triggerStageId) : null,
      triggerPipelineId: form.triggerPipelineId ? Number(form.triggerPipelineId) : null,
      actionStageId: form.actionStageId ? Number(form.actionStageId) : null,
      actionPipelineId: form.actionPipelineId ? Number(form.actionPipelineId) : null,
    };
    if (modal && modal !== 'new') await api.put(`/automation/rules/${modal.id}`, payload);
    else await api.post('/automation/rules', payload);
    fetch();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Regras executadas automaticamente pelo motor quando um negócio muda de etapa.
        </p>
        <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          <Plus size={16} /> Nova Automação
        </button>
      </div>
      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 text-sm">
          Nenhuma automação cadastrada
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Nome</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Gatilho</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Ação</th>
                <th className="text-center px-5 py-3 text-xs font-bold text-gray-500 uppercase">Ativo</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm font-semibold">{r.name}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">
                    {r.trigger}
                    {r.triggerStageId && <span className="text-gray-400"> · stage #{r.triggerStageId}</span>}
                    {r.triggerPipelineId && <span className="text-gray-400"> · pipeline #{r.triggerPipelineId}</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600">
                    {r.action}
                    {r.taskTitle && <span className="text-gray-400"> · {r.taskTitle}</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {r.active ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(r)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                      <button onClick={() => remove(r.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <SimpleFormModal
          title={modal === 'new' ? 'Nova Automação' : 'Editar Automação'}
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'trigger', label: 'Gatilho', type: 'select', default: 'stage_enter',
              options: [
                { value: 'stage_enter', label: 'Deal entra na etapa (stage_enter)' },
              ] },
            { key: 'triggerPipelineId', label: 'Pipeline do gatilho (opcional)', type: 'number', placeholder: 'ID do pipeline' },
            { key: 'triggerStageId', label: 'Etapa do gatilho (opcional)', type: 'number', placeholder: 'ID da etapa' },
            { key: 'action', label: 'Ação', type: 'select', default: 'create_task',
              options: [
                { value: 'create_task', label: 'Criar tarefa' },
                { value: 'move_pipeline', label: 'Mover para pipeline/etapa' },
              ] },
            { key: 'taskTitle', label: 'Título da tarefa (se ação = create_task)' },
            { key: 'actionPipelineId', label: 'Pipeline destino (se move_pipeline)', type: 'number' },
            { key: 'actionStageId', label: 'Etapa destino (se move_pipeline)', type: 'number' },
            { key: 'active', label: 'Ativa', type: 'select', default: 'true',
              options: [{ value: 'true', label: 'Sim' }, { value: 'false', label: 'Não' }] },
          ]}
          initial={modal === 'new' ? null : {
            ...modal,
            active: modal.active ? 'true' : 'false',
          }}
          onClose={() => setModal(null)}
          onSubmit={save}
        />
      )}
    </>
  );
}

function EmpresaTab() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-10 text-center">
      <div className="text-sm text-gray-400 mb-2">Dados da empresa (razão social, CNPJ, endereço, logo)</div>
      <div className="text-xs text-gray-300">Em breve</div>
    </div>
  );
}

function TemplatesTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter ? `?tipo=${filter}` : '';
      const r = await api.get(`/documents/templates${q}`);
      setItems(r.data);
    } catch { setItems([]); } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (id) => {
    if (!confirm('Excluir este template?')) return;
    await api.delete(`/documents/templates/${id}`);
    fetch();
  };

  const save = async (form) => {
    const payload = {
      name: form.name,
      tipo: form.tipo,
      corpo: form.corpo,
      observacoes: form.observacoes || null,
    };
    if (modal && modal !== 'new') await api.put(`/documents/templates/${modal.id}`, payload);
    else await api.post('/documents/templates', payload);
    fetch();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Modelos reutilizáveis para orçamentos e contratos. Use <code className="bg-gray-100 px-1 rounded">{'{{campo}}'}</code> para variáveis.
        </p>
        <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          <Plus size={16} /> Novo Template
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase">Filtrar:</span>
        {['', 'orcamento', 'contrato'].map((f) => (
          <button
            key={f || 'all'}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${filter === f ? 'bg-erplus-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f === '' ? 'Todos' : f === 'orcamento' ? 'Orçamentos' : 'Contratos'}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 text-sm">
          Nenhum template cadastrado
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Nome</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Observações</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm font-semibold">{t.name}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.tipo === 'orcamento' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {t.tipo === 'orcamento' ? 'Orçamento' : 'Contrato'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 truncate max-w-xs">{t.observacoes || '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(t)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                      <button onClick={() => remove(t.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <SimpleFormModal
          title={modal === 'new' ? 'Novo Template' : 'Editar Template'}
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'tipo', label: 'Tipo', type: 'select', default: 'orcamento',
              options: [{ value: 'orcamento', label: 'Orçamento' }, { value: 'contrato', label: 'Contrato' }] },
            { key: 'corpo', label: 'Corpo (suporta {{placeholders}})', type: 'textarea' },
            { key: 'observacoes', label: 'Observações', type: 'textarea' },
          ]}
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSubmit={save}
        />
      )}
    </>
  );
}

// ═══════════ Helper ═══════════

function SimpleList({ items, columns, emptyLabel }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 text-sm">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            {columns.map((c) => (
              <th key={c.key} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-gray-50 hover:bg-gray-50/50">
              {columns.map((c) => {
                const raw = it[c.key];
                const val = c.render ? c.render(raw) : (raw ?? c.fallback ?? '');
                if (c.badge && raw && c.badge[raw]) {
                  return (
                    <td key={c.key} className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.badge[raw]}`}>{raw}</span>
                    </td>
                  );
                }
                return <td key={c.key} className="px-5 py-3 text-sm text-gray-600">{val}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════ ConfigPage ═══════════

const TABS = [
  { id: 'empresa', label: 'Empresa', Component: EmpresaTab },
  { id: 'usuarios', label: 'Usuários', Component: UsersTab },
  { id: 'contact-types', label: 'Tipos de Contato', Component: ContactTypesTab },
  { id: 'business-types', label: 'Tipos de Negócio', Component: BusinessTypesTab },
  { id: 'servicos', label: 'Serviços', Component: ServicesTab },
  { id: 'cost-centers', label: 'Centros de Custo', Component: CostCentersTab },
  { id: 'templates', label: 'Templates', Component: TemplatesTab },
  { id: 'automations', label: 'Automações', Component: AutomationsTab },
];

export default function ConfigPage() {
  const [tab, setTab] = useState('servicos');
  const Active = TABS.find((t) => t.id === tab)?.Component ?? ServicesTab;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold text-erplus-text flex items-center gap-2">
        <Settings size={20} /> Configurações
      </h1>

      <div className="flex gap-1 overflow-x-auto bg-gray-100 rounded-lg p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              tab === t.id ? 'bg-white text-erplus-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Active />
    </div>
  );
}
