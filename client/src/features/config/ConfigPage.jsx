import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, Users, UserCog, Tag, Briefcase, DollarSign,
  TrendingUp, Settings as SettingsIcon, ClipboardCheck, ClipboardList,
  Layers, FileText, Plus, X, Save, Edit2, Trash2, Search, Eye, GripVertical,
  ChevronDown, ChevronRight, Check, Circle,
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';

// ═══════════════ Utilities ═══════════════

const BRL = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const initials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '').toUpperCase() + (parts[parts.length - 1]?.[0] ?? '').toUpperCase();
};

// ═══════════════ Reusable pieces ═══════════════

function Modal({ title, onClose, children, maxWidth = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[92vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function SimpleFormModal({ title, fields, initial, onClose, onSubmit, maxWidth }) {
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
    <Modal title={title} onClose={onClose} maxWidth={maxWidth}>
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
                rows={f.rows || 3}
                placeholder={f.placeholder}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none font-mono"
              />
            ) : f.type === 'select' ? (
              <select
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
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
            {f.hint && <p className="mt-1 text-xs text-gray-400">{f.hint}</p>}
          </div>
        ))}
      </div>
      {err && <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{err}</div>}
      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg disabled:opacity-50 flex items-center gap-2 hover:bg-red-700">
          <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </Modal>
  );
}

function SectionCard({ title, subtitle, right, children, padded = true }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {(title || right) && (
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            {title && <h2 className="text-base font-bold text-erplus-text">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      <div className={padded ? 'p-6' : ''}>{children}</div>
    </div>
  );
}

function AccentButton({ icon: Icon = Plus, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
    >
      <Icon size={16} /> {children}
    </button>
  );
}

function SearchBox({ value, onChange, placeholder = 'Pesquisar...' }) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm"
      />
    </div>
  );
}

function EmptyState({ label, hint }) {
  return (
    <div className="py-12 text-center text-gray-400 text-sm">
      {label}
      {hint && <div className="text-xs mt-1 text-gray-300">{hint}</div>}
    </div>
  );
}

function Badge({ color = 'gray', children }) {
  const palette = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    rose: 'bg-rose-50 text-erplus-accent',
    yellow: 'bg-amber-50 text-amber-700',
    pink: 'bg-pink-50 text-pink-600',
  };
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${palette[color] || palette.gray}`}>
      {children}
    </span>
  );
}

// ═══════════════ 1. Empresa ═══════════════

const EMPRESA_FIELDS = [
  { key: 'nome_fantasia', label: 'Nome fantasia' },
  { key: 'razao_social', label: 'Razão social' },
  { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
  { key: 'crea', label: 'Registro profissional', placeholder: 'Ex.: CREA-SC 000000-0' },
  { key: 'endereco', label: 'Endereço', type: 'textarea', rows: 2 },
  { key: 'telefone', label: 'Telefone' },
  { key: 'email', label: 'E-mail' },
  { key: 'site', label: 'Site' },
  { key: 'logo_url', label: 'URL do logotipo' },
];

function EmpresaTab() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/config/settings');
      const map = {};
      for (const s of r.data) map[s.key] = s.value;
      setValues(map);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    for (const f of EMPRESA_FIELDS) {
      await api.post('/config/settings', { key: f.key, value: form[f.key] ?? '' });
    }
    load();
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Carregando...</div>;

  const displayName = values.nome_fantasia || values.razao_social || 'EG Projetos & Consultorias';
  const registro = values.crea || 'Registro não informado';

  return (
    <>
      <SectionCard
        title="Minha Empresa"
        right={<button onClick={() => setEditing(true)} className="p-2 text-gray-400 hover:text-erplus-accent hover:bg-rose-50 rounded-lg"><Edit2 size={16} /></button>}
      >
        <div className="flex items-center gap-4">
          {values.logo_url ? (
            <img src={values.logo_url} alt="logo" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-erplus-accent text-white flex items-center justify-center text-2xl font-black">
              {initials(displayName)}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-erplus-text">{displayName}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{registro}</p>
          </div>
        </div>
      </SectionCard>

      {editing && (
        <SimpleFormModal
          title="Editar dados da empresa"
          fields={EMPRESA_FIELDS}
          initial={values}
          onClose={() => setEditing(false)}
          onSubmit={save}
          maxWidth="max-w-2xl"
        />
      )}
    </>
  );
}

// ═══════════════ 2. Usuários & Permissões ═══════════════

const PERMISSION_ROWS = [
  { resource: 'dashboard',      label: 'Dashboard',       kind: 'view' },
  { resource: 'agenda',         label: 'Agenda',          kind: 'view' },
  { resource: 'contatos',       label: 'Contatos',        kind: 'view' },
  { resource: 'financeiro',     label: 'Financeiro',      kind: 'view' },
  { resource: 'comercial',      label: 'Comercial',       kind: 'view' },
  { resource: 'empreendimentos',label: 'Empreendimentos', kind: 'view' },
  { resource: 'producao',       label: 'Produção',        kind: 'view' },
  { resource: 'suporte',        label: 'Suporte',         kind: 'view' },
  { resource: 'configuracoes',  label: 'Configurações',   kind: 'view' },
  { resource: 'relatorios',     label: 'Relatórios PDF',  kind: 'view' },
  // Globais: controlam todos os resources de uma vez.
  { resource: '_global_edit',   label: 'Criar / Editar',  kind: 'edit' },
  { resource: '_global_delete', label: 'Excluir registros', kind: 'delete' },
];

const ROLE_COLUMNS = [
  { id: 'Operador Master', short: 'Operador Master' },
  { id: 'Colaborador',     short: 'Colaborador' },
  { id: 'Visitante',       short: 'Visitante' },
];

function UsersPermissionsTab() {
  const [users, setUsers] = useState([]);
  const [perms, setPerms] = useState({}); // { roleName: { resource: { canView, canEdit, canDelete } } }
  const [loading, setLoading] = useState(true);
  const [newUserModal, setNewUserModal] = useState(false);
  const { user: currentUser, simulatedUser, simulateAs, exitSimulation } = useAuthStore();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        api.get('/identity/users'),
        api.get('/identity/permissions/'),
      ]);
      setUsers(uRes.data);
      setPerms(pRes.data || {});
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Célula marcada? Para view usa canView daquele resource; para edit/delete usa
  // o "OU" de todos os resources reais (se ao menos um está true, considera ativo).
  const isChecked = (role, row) => {
    const rolePerms = perms[role] || {};
    if (row.kind === 'view') return rolePerms[row.resource]?.canView === true;
    const action = row.kind === 'edit' ? 'canEdit' : 'canDelete';
    return Object.values(rolePerms).some(p => p?.[action] === true);
  };

  const toggleCell = async (role, row) => {
    const rolePerms = { ...(perms[role] || {}) };
    const current = isChecked(role, row);
    const next = !current;

    if (row.kind === 'view') {
      const prev = rolePerms[row.resource] || { canView: false, canEdit: false, canDelete: false };
      rolePerms[row.resource] = { ...prev, canView: next };
    } else {
      const action = row.kind === 'edit' ? 'canEdit' : 'canDelete';
      // Seta o flag em todos os resources reais daquele role.
      for (const r of PERMISSION_ROWS.filter(p => p.kind === 'view')) {
        const prev = rolePerms[r.resource] || { canView: false, canEdit: false, canDelete: false };
        rolePerms[r.resource] = { ...prev, [action]: next };
      }
    }

    setPerms({ ...perms, [role]: rolePerms });
    try {
      await api.put('/identity/permissions/', { roleName: role, permissions: rolePerms });
    } catch {
      // reverte em caso de erro
      load();
    }
  };

  const changeUserRole = async (userId, role) => {
    try {
      await api.put(`/identity/users/${userId}`, { role });
      load();
    } catch { /* noop */ }
  };

  const deleteUser = async (u) => {
    if (u.id === currentUser?.id) return;
    if (!confirm(`Remover ${u.name}?`)) return;
    await api.delete(`/identity/users/${u.id}`);
    load();
  };

  const createUser = async (form) => {
    await api.post('/identity/users', {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    });
    load();
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-5">
      {/* Usuários */}
      <SectionCard
        title="Usuários"
        right={<AccentButton onClick={() => setNewUserModal(true)}>Novo Usuário</AccentButton>}
      >
        <div className="space-y-2">
          {users.length === 0 ? (
            <EmptyState label="Nenhum usuário cadastrado" />
          ) : users.map((u) => {
            const isYou = u.id === currentUser?.id;
            return (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${isYou ? 'bg-erplus-accent text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {initials(u.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{u.name}</span>
                      {isYou && <Badge color="rose">VOCÊ</Badge>}
                    </div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeUserRole(u.id, e.target.value)}
                    disabled={isYou}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white disabled:bg-gray-50"
                  >
                    {ROLE_COLUMNS.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}
                  </select>
                  <Badge color={u.role === 'Operador Master' ? 'rose' : u.role === 'Colaborador' ? 'blue' : 'gray'}>{u.role}</Badge>
                  {!isYou && (
                    <button onClick={() => deleteUser(u)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Matriz de Permissões */}
      <SectionCard title="Matriz de Permissões" subtitle="Defina o que cada perfil pode acessar ou realizar no sistema.">
        <div className="overflow-x-auto -mx-6 -my-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Permissão</th>
                {ROLE_COLUMNS.map(c => (
                  <th key={c.id} className="text-center px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">{c.short}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_ROWS.map(row => (
                <tr key={row.resource} className="border-b border-gray-50 last:border-b-0">
                  <td className="px-6 py-3 text-sm text-gray-700">{row.label}</td>
                  {ROLE_COLUMNS.map(c => {
                    const on = isChecked(c.id, row);
                    return (
                      <td key={c.id} className="px-6 py-3 text-center">
                        <button
                          onClick={() => toggleCell(c.id, row)}
                          className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition ${
                            on ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'border border-gray-200 hover:border-gray-400'
                          }`}
                          aria-label={`${row.label} — ${c.id}`}
                        >
                          {on && <Check size={14} strokeWidth={3} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Simular Acesso */}
      <SectionCard title="Simular Acesso" subtitle="Visualize o sistema como outro usuário para testar permissões.">
        <div className="flex flex-wrap gap-2">
          {users.map((u) => {
            const isActive = simulatedUser?.id === u.id || (!simulatedUser && u.id === currentUser?.id);
            return (
              <button
                key={u.id}
                onClick={() => {
                  if (u.id === currentUser?.id) exitSimulation();
                  else simulateAs(u);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                  isActive
                    ? 'border-erplus-accent bg-rose-50 text-erplus-accent'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-erplus-accent text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {initials(u.name)}
                </div>
                <span className="text-sm font-semibold">{u.name.split(' ')[0]}</span>
                <span className="text-xs text-gray-400">({u.role})</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {newUserModal && (
        <SimpleFormModal
          title="Novo Usuário"
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'email', label: 'E-mail', required: true, type: 'email' },
            { key: 'password', label: 'Senha inicial', required: true, hint: 'Mínimo 6 caracteres. O usuário pode alterar depois.' },
            { key: 'role', label: 'Perfil', type: 'select', default: 'Colaborador',
              options: ROLE_COLUMNS.map(r => ({ value: r.id, label: r.id })) },
          ]}
          onClose={() => setNewUserModal(false)}
          onSubmit={createUser}
        />
      )}
    </div>
  );
}

// ═══════════════ 3. Tipo de Contatos ═══════════════

function ContactTypesTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/crm/contact-types');
      setItems(r.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    await api.post('/crm/contact-types', form);
    load();
  };

  const remove = async (it) => {
    if (it.contactCount > 0) {
      alert(`Este tipo é usado por ${it.contactCount} contato(s). Reclassifique-os antes de excluir.`);
      return;
    }
    if (!confirm(`Excluir tipo "${it.name}"?`)) return;
    try {
      await api.delete(`/crm/contact-types/${it.id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao excluir');
    }
  };

  return (
    <SectionCard
      title="Tipo de Contatos"
      subtitle="Defina os tipos de contato para classificar seus contatos (Lead, Cliente, Fornecedor, etc)."
      right={<AccentButton onClick={() => setModal('new')}>Novo Tipo</AccentButton>}
      padded={false}
    >
      {loading ? <div className="py-12 text-center text-gray-400">Carregando...</div>
        : items.length === 0 ? <EmptyState label="Nenhum tipo cadastrado" />
        : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Descrição</th>
                <th className="text-center px-6 py-3 text-xs font-bold text-gray-500 uppercase">Contatos</th>
                <th className="w-12 px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 last:border-b-0">
                  <td className="px-6 py-3 text-sm font-semibold">{t.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{t.description || '—'}</td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                      {t.contactCount ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => remove(t)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </SectionCard>
  );
}

// ═══════════════ 4. Tipos de Negócio ═══════════════

function BusinessTypesTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/commercial/business-types');
      setItems(r.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    const payload = { name: form.name, description: form.description || null };
    if (modal && modal !== 'new') await api.put(`/commercial/business-types/${modal.id}`, payload);
    else await api.post('/commercial/business-types', payload);
    load();
  };

  const remove = async (it) => {
    if (!confirm(`Excluir "${it.name}"? Negócios vinculados podem ficar sem referência.`)) return;
    await api.delete(`/commercial/business-types/${it.id}`);
    load();
  };

  return (
    <SectionCard
      title="Tipos de Negócio"
      subtitle="Defina os tipos de negócio para classificar seus cartões comerciais e usar em automações."
      right={<AccentButton onClick={() => setModal('new')}>Novo Tipo</AccentButton>}
      padded={false}
    >
      {loading ? <div className="py-12 text-center text-gray-400">Carregando...</div>
        : items.length === 0 ? <EmptyState label="Nenhum tipo cadastrado" />
        : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Descrição</th>
                <th className="w-20 px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 last:border-b-0">
                  <td className="px-6 py-3 text-sm font-semibold">{b.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{b.description || '—'}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(b)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => remove(b)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      {modal && (
        <SimpleFormModal
          title={modal === 'new' ? 'Novo Tipo de Negócio' : 'Editar Tipo de Negócio'}
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'description', label: 'Descrição', type: 'textarea' },
          ]}
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSubmit={save}
        />
      )}
    </SectionCard>
  );
}

// ═══════════════ 5. Produtos & Serviços ═══════════════

function ServicesTab() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/config/services');
      setItems(r.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) =>
      s.name?.toLowerCase().includes(q)
      || s.category?.toLowerCase().includes(q)
      || s.description?.toLowerCase().includes(q));
  }, [items, search]);

  const save = async (form) => {
    const payload = { ...form, price: Number(form.price || 0) };
    if (modal && modal !== 'new') await api.put(`/config/services/${modal.id}`, payload);
    else await api.post('/config/services', payload);
    load();
  };

  const remove = async (it) => {
    if (!confirm(`Excluir "${it.name}"?`)) return;
    await api.delete(`/config/services/${it.id}`);
    load();
  };

  return (
    <SectionCard
      title="Produtos & Serviços"
      right={<AccentButton onClick={() => setModal('new')}>Novo Serviço</AccentButton>}
    >
      <div className="mb-4">
        <SearchBox value={search} onChange={setSearch} placeholder="Pesquisar..." />
      </div>

      {loading ? <div className="py-12 text-center text-gray-400">Carregando...</div>
        : filtered.length === 0 ? <EmptyState label="Nenhum serviço encontrado" />
        : (
          <div className="-mx-6 -mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Serviço</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Categoria</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Unidade</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Valor</th>
                  <th className="text-center px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="w-20 px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50">
                    <td className="px-6 py-3">
                      <div className="text-sm font-semibold">{s.name}</div>
                      {s.description && <div className="text-xs text-gray-400">{s.description}</div>}
                    </td>
                    <td className="px-6 py-3">{s.category ? <Badge color="blue">{s.category}</Badge> : '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{s.unit || '—'}</td>
                    <td className="px-6 py-3 text-sm font-bold text-erplus-accent">{BRL(s.price)}</td>
                    <td className="px-6 py-3 text-center">
                      <Badge color={s.status === 'Ativo' ? 'green' : 'gray'}>{s.status || '—'}</Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal(s)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                        <button onClick={() => remove(s)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
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
            { key: 'price', label: 'Valor', type: 'number' },
            { key: 'description', label: 'Descrição', type: 'textarea', rows: 2 },
            { key: 'status', label: 'Status', type: 'select', default: 'Ativo',
              options: [{ value: 'Ativo', label: 'Ativo' }, { value: 'Inativo', label: 'Inativo' }] },
          ]}
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSubmit={save}
        />
      )}
    </SectionCard>
  );
}

// ═══════════════ 6. Centro de Custos ═══════════════

function CostCentersTab() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/finance/cost-centers');
      setItems(r.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.name?.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q));
  }, [items, search]);

  const save = async (form) => {
    await api.post('/finance/cost-centers', form);
    load();
  };

  return (
    <SectionCard
      title="Centro de Custos"
      subtitle="Classifique receitas e despesas por centro de custo para gestão financeira."
      right={<AccentButton onClick={() => setModal('new')}>Novo Centro</AccentButton>}
    >
      <div className="mb-4">
        <SearchBox value={search} onChange={setSearch} />
      </div>

      {loading ? <div className="py-12 text-center text-gray-400">Carregando...</div>
        : filtered.length === 0 ? <EmptyState label="Nenhum centro cadastrado" />
        : (
          <div className="-mx-6 -mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Centro de custo</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Classificação</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Descrição</th>
                  <th className="text-center px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-sm font-semibold">{c.name}</td>
                    <td className="px-6 py-3"><Badge color={c.type === 'Receita' ? 'green' : 'red'}>{c.type}</Badge></td>
                    <td className="px-6 py-3">{c.category ? <Badge color="blue">{c.category}</Badge> : '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{c.description || '—'}</td>
                    <td className="px-6 py-3 text-center"><Badge color="green">Ativo</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {modal && (
        <SimpleFormModal
          title="Novo Centro de Custo"
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'type', label: 'Tipo', type: 'select', default: 'Despesa',
              options: [{ value: 'Receita', label: 'Receita' }, { value: 'Despesa', label: 'Despesa' }] },
            { key: 'category', label: 'Classificação', placeholder: 'Ex: Administrativo, Operacional, Tributário' },
            { key: 'description', label: 'Descrição', type: 'textarea', rows: 2 },
          ]}
          onClose={() => setModal(null)}
          onSubmit={save}
        />
      )}
    </SectionCard>
  );
}

// ═══════════════ 7. Negociações — Pipelines ═══════════════

function PipelinesTab() {
  const [pipelines, setPipelines] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/commercial/pipelines');
      setPipelines(r.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/commercial/pipelines', { name: newName.trim() });
      setNewName('');
      load();
    } finally { setCreating(false); }
  };

  const remove = async (p) => {
    if (!confirm(`Excluir pipeline "${p.name}"? Negociações associadas podem perder referência.`)) return;
    await api.delete(`/commercial/pipelines/${p.id}`);
    load();
  };

  return (
    <SectionCard title="Negociações — Pipelines">
      {loading ? <div className="py-12 text-center text-gray-400">Carregando...</div>
        : (
          <div className="space-y-2">
            {pipelines.length === 0 && <EmptyState label="Nenhum pipeline" />}
            {pipelines.map((p) => {
              const stagesCount = p.stages?.length ?? 0;
              const dealsCount = p.dealsCount ?? 0;
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="text-gray-300" />
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-xs text-gray-400">
                        {stagesCount} etapa{stagesCount !== 1 ? 's' : ''} · {dealsCount} negociaç{dealsCount !== 1 ? 'ões' : 'ão'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-erplus-accent bg-rose-50 rounded-lg hover:bg-rose-100"
                  >
                    <Trash2 size={12} /> Remover
                  </button>
                </div>
              );
            })}
            <div className="flex items-center gap-2 pt-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && create()}
                placeholder="Nome do novo pipeline de negociações..."
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
              />
              <button
                onClick={create}
                disabled={creating || !newName.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-erplus-accent text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-red-700"
              >
                <Plus size={14} /> Criar
              </button>
            </div>
          </div>
        )}
    </SectionCard>
  );
}

// ═══════════════ 8. Automações ═══════════════

const AUTOMATION_TRIGGER_LABELS = {
  stage_enter: 'Entrada em etapa',
  deal_won: 'Deal ganho',
  task_complete: 'Tarefa concluída',
};
const AUTOMATION_ACTION_LABELS = {
  create_task: 'Criar tarefa',
  move_pipeline: 'Mover para pipeline/etapa',
  load_diligence: 'Carregar diligência',
};

function AutomationsTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/automation/rules');
      setItems(r.data);
    } catch { setItems([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (rule) => {
    await api.put(`/automation/rules/${rule.id}`, { ...rule, active: !rule.active });
    load();
  };

  const remove = async (rule) => {
    if (!confirm('Excluir esta automação?')) return;
    await api.delete(`/automation/rules/${rule.id}`);
    load();
  };

  const save = async (form) => {
    const payload = {
      ...form,
      active: form.active === 'true' || form.active === true,
      triggerStageId: form.triggerStageId ? Number(form.triggerStageId) : null,
      triggerPipelineId: form.triggerPipelineId ? Number(form.triggerPipelineId) : null,
      actionStageId: form.actionStageId ? Number(form.actionStageId) : null,
      actionPipelineId: form.actionPipelineId ? Number(form.actionPipelineId) : null,
      diligenceTemplateId: form.diligenceTemplateId ? Number(form.diligenceTemplateId) : null,
      conditionJson: form.conditionJson?.trim() || null,
    };
    if (modal && modal !== 'new') await api.put(`/automation/rules/${modal.id}`, payload);
    else await api.post('/automation/rules', payload);
    load();
  };

  const describe = (r) => {
    const trigger = AUTOMATION_TRIGGER_LABELS[r.trigger] || r.trigger;
    const action = AUTOMATION_ACTION_LABELS[r.action] || r.action;
    const detail = r.taskTitle ? ` — ${r.taskTitle}` : '';
    return `Gatilho: ${trigger} → ${action}${detail}`;
  };

  return (
    <SectionCard
      title="Automações"
      subtitle="Automações executam ações quando negociações entram em etapas específicas."
      right={<AccentButton onClick={() => setModal('new')}>Nova</AccentButton>}
    >
      {loading ? <div className="py-12 text-center text-gray-400">Carregando...</div>
        : items.length === 0 ? <EmptyState label="Nenhuma automação cadastrada" />
        : (
          <div className="space-y-2">
            {items.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2">
                <div className="flex items-start gap-3">
                  <Circle size={10} className={`mt-1.5 fill-current ${r.active ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <div>
                    <div className="text-sm font-semibold">{r.name}</div>
                    <div className="text-xs text-gray-500">{describe(r)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggle(r)}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    {r.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => remove(r)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

      {modal && (
        <SimpleFormModal
          title={modal === 'new' ? 'Nova Automação' : 'Editar Automação'}
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'trigger', label: 'Gatilho', type: 'select', default: 'stage_enter',
              options: Object.entries(AUTOMATION_TRIGGER_LABELS).map(([v, l]) => ({ value: v, label: l })) },
            { key: 'triggerPipelineId', label: 'Pipeline do gatilho (opcional)', type: 'number', placeholder: 'ID do pipeline' },
            { key: 'triggerStageId', label: 'Etapa do gatilho (opcional)', type: 'number' },
            { key: 'action', label: 'Ação', type: 'select', default: 'create_task',
              options: Object.entries(AUTOMATION_ACTION_LABELS).map(([v, l]) => ({ value: v, label: l })) },
            { key: 'taskTitle', label: 'Título da tarefa (se ação = create_task)' },
            { key: 'actionPipelineId', label: 'Pipeline destino', type: 'number' },
            { key: 'actionStageId', label: 'Etapa destino', type: 'number' },
            { key: 'diligenceTemplateId', label: 'Template de diligência', type: 'number' },
            { key: 'conditionJson', label: 'Condições (JSON opcional)', type: 'textarea',
              placeholder: '[{"field":"deal.value","op":"gt","value":10000}]' },
            { key: 'active', label: 'Ativa', type: 'select', default: 'true',
              options: [{ value: 'true', label: 'Sim' }, { value: 'false', label: 'Não' }] },
          ]}
          initial={modal === 'new' ? null : { ...modal, active: modal.active ? 'true' : 'false' }}
          onClose={() => setModal(null)}
          onSubmit={save}
        />
      )}
    </SectionCard>
  );
}

// ═══════════════ 9. Diligências ═══════════════

function DiligencesTab() {
  const [items, setItems] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, bRes] = await Promise.all([
        api.get('/commercial/diligence-templates'),
        api.get('/commercial/business-types'),
      ]);
      setItems(dRes.data);
      setBusinessTypes(bRes.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const btLabel = (id) => businessTypes.find((b) => b.id === id)?.name || '—';

  const save = async (form) => {
    const payload = {
      name: form.name,
      businessTypeId: form.businessTypeId ? Number(form.businessTypeId) : null,
      itemsJson: form.itemsJson || '[]',
    };
    if (modal && modal !== 'new') await api.put(`/commercial/diligence-templates/${modal.id}`, payload);
    else await api.post('/commercial/diligence-templates', payload);
    load();
  };

  const remove = async (it) => {
    if (!confirm(`Excluir grupo "${it.name}"?`)) return;
    await api.delete(`/commercial/diligence-templates/${it.id}`);
    load();
  };

  const parseItems = (json) => {
    try {
      const arr = JSON.parse(json || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  };

  return (
    <SectionCard
      title="Grupos de Diligência"
      subtitle="Crie checklists de diligência pré-configurados vinculados a tipos de negócio."
      right={<AccentButton onClick={() => setModal('new')}>Novo Grupo</AccentButton>}
    >
      {loading ? <div className="py-12 text-center text-gray-400">Carregando...</div>
        : items.length === 0 ? <EmptyState label="Nenhum grupo cadastrado" />
        : (
          <div className="space-y-3">
            {items.map((g) => {
              const its = parseItems(g.itemsJson);
              const open = expanded === g.id;
              return (
                <div key={g.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-start justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold">{g.name}</h3>
                      </div>
                      <div className="mt-1.5">
                        <Badge color="purple">{btLabel(g.businessTypeId)}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Badge color="gray">{its.length} {its.length === 1 ? 'item' : 'itens'}</Badge>
                      <button onClick={() => setModal(g)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => remove(g)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpanded(open ? null : g.id)}
                    className="w-full px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1"
                  >
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {open ? 'Recolher' : `Ver ${its.length} item${its.length !== 1 ? 's' : ''}`}
                  </button>

                  {open && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
                      <ul className="mt-3 space-y-1.5">
                        {its.map((it, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <ChevronRight size={14} className="mt-0.5 text-gray-300 shrink-0" />
                            <span>{typeof it === 'string' ? it : (it.label || it.name)}</span>
                          </li>
                        ))}
                        {its.length === 0 && <li className="text-xs text-gray-400">Nenhum item</li>}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {modal && (
        <SimpleFormModal
          title={modal === 'new' ? 'Novo Grupo de Diligência' : 'Editar Grupo'}
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'businessTypeId', label: 'Tipo de Negócio', type: 'select', default: '',
              options: [{ value: '', label: '— nenhum —' }, ...businessTypes.map(b => ({ value: b.id, label: b.name }))] },
            { key: 'itemsJson', label: 'Itens (JSON array)', type: 'textarea', rows: 6,
              placeholder: '["Matrícula atualizada","Certidão de ônus reais",...]',
              hint: 'Lista de strings ou objetos { label, required }. Um item por linha no JSON.' },
          ]}
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSubmit={save}
          maxWidth="max-w-2xl"
        />
      )}
    </SectionCard>
  );
}

// ═══════════════ 10. Briefings ═══════════════

function BriefingsTab() {
  const [items, setItems] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/commercial/briefing-templates');
      setItems(r.data);
    } catch { setItems([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    const payload = { name: form.name, fieldsJson: form.fieldsJson || '[]' };
    if (modal && modal !== 'new') await api.put(`/commercial/briefing-templates/${modal.id}`, payload);
    else await api.post('/commercial/briefing-templates', payload);
    load();
  };

  const remove = async (it) => {
    if (!confirm(`Excluir briefing "${it.name}"?`)) return;
    await api.delete(`/commercial/briefing-templates/${it.id}`);
    load();
  };

  const parseFields = (json) => {
    try {
      const arr = JSON.parse(json || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  };

  return (
    <SectionCard
      title="Templates de Briefing"
      subtitle="Crie templates de briefing com campos pré-definidos para cada tipo de empreendimento."
      right={<AccentButton onClick={() => setModal('new')}>Novo Briefing</AccentButton>}
    >
      {loading ? <div className="py-12 text-center text-gray-400">Carregando...</div>
        : items.length === 0 ? <EmptyState label="Nenhum template cadastrado" />
        : (
          <div className="space-y-3">
            {items.map((b) => {
              const fields = parseFields(b.fieldsJson);
              const open = expanded === b.id;
              return (
                <div key={b.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-start justify-between p-4">
                    <h3 className="text-sm font-bold">{b.name}</h3>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Badge color="gray">{fields.length} {fields.length === 1 ? 'campo' : 'campos'}</Badge>
                      <button onClick={() => setModal(b)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => remove(b)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpanded(open ? null : b.id)}
                    className="w-full px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1"
                  >
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {open ? 'Recolher' : `Ver ${fields.length} campo${fields.length !== 1 ? 's' : ''}`}
                  </button>
                  {open && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
                      <ul className="mt-3 space-y-1.5">
                        {fields.map((f, i) => {
                          const label = typeof f === 'string' ? f : (f.label || f.name || 'Campo');
                          const required = typeof f === 'object' && f.required;
                          return (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <ChevronRight size={14} className="mt-0.5 text-gray-300 shrink-0" />
                              <span>
                                {label}
                                {required && <span className="text-erplus-accent ml-1">*</span>}
                              </span>
                            </li>
                          );
                        })}
                        {fields.length === 0 && <li className="text-xs text-gray-400">Nenhum campo</li>}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {modal && (
        <SimpleFormModal
          title={modal === 'new' ? 'Novo Briefing' : 'Editar Briefing'}
          fields={[
            { key: 'name', label: 'Nome', required: true, placeholder: 'Ex.: Residencial Multifamiliar' },
            { key: 'fieldsJson', label: 'Campos (JSON array)', type: 'textarea', rows: 8,
              placeholder: '[{"label":"Tipologia do empreendimento","required":true},{"label":"Número de pavimentos","required":true}]',
              hint: 'Array de objetos { label, required }. Campos com required:true exibem * vermelho.' },
          ]}
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSubmit={save}
          maxWidth="max-w-2xl"
        />
      )}
    </SectionCard>
  );
}

// ═══════════════ 11. Tipos de Produção ═══════════════

const PROD_CATEGORIES = [
  { id: 'licenciamentos',   label: 'Licenciamentos',   color: 'bg-amber-400' },
  { id: 'design',           label: 'Design Criativo',  color: 'bg-pink-400' },
  { id: 'projetos',         label: 'Projetos',         color: 'bg-purple-400' },
  { id: 'revisao_tecnica',  label: 'Revisão Técnica',  color: 'bg-blue-400' },
  { id: 'incorporacoes',    label: 'Incorporações',    color: 'bg-emerald-400' },
  { id: 'supervisao',       label: 'Supervisão',       color: 'bg-cyan-400' },
  { id: 'vistorias',        label: 'Vistorias',        color: 'bg-orange-400' },
  { id: 'averbacoes',       label: 'Averbações',       color: 'bg-teal-400' },
];

function ProductionTypesTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/production/item-types');
      setItems(r.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const map = {};
    for (const cat of PROD_CATEGORIES) map[cat.id] = [];
    for (const t of items) {
      if (!map[t.categoria]) map[t.categoria] = [];
      map[t.categoria].push(t);
    }
    return map;
  }, [items]);

  const countTasks = (t) => {
    try {
      const arr = JSON.parse(t.autoTasksJson || '[]');
      return Array.isArray(arr) ? arr.length : 0;
    } catch { return 0; }
  };

  const save = async (form) => {
    const payload = {
      name: form.name,
      categoria: form.categoria,
      descricao: form.descricao || null,
      autoTasksJson: form.autoTasksJson || null,
    };
    if (modal && modal !== 'new') {
      await api.put(`/production/item-types/${modal.id}`, { ...payload, status: form.status });
    } else {
      await api.post('/production/item-types', payload);
    }
    load();
  };

  const remove = async (t) => {
    if (!confirm(`Excluir tipo "${t.name}"?`)) return;
    await api.delete(`/production/item-types/${t.id}`);
    load();
  };

  return (
    <SectionCard
      title="Tipos de Produção"
      subtitle="Pré-configure os tipos de itens de produção para uso nos empreendimentos."
      right={<AccentButton onClick={() => setModal('new')}>Novo Tipo</AccentButton>}
    >
      {loading ? <div className="py-12 text-center text-gray-400">Carregando...</div>
        : items.length === 0 ? <EmptyState label="Nenhum tipo cadastrado" hint="Tipos organizados por categoria da produção (Licenciamentos, Design, Projetos...)." />
        : (
          <div className="space-y-5">
            {PROD_CATEGORIES.map((cat) => {
              const list = grouped[cat.id] || [];
              if (list.length === 0) return null;
              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                    <h4 className="text-sm font-bold">{cat.label}</h4>
                    <Badge color="gray">{list.length}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {list.map((t) => {
                      const tasks = countTasks(t);
                      return (
                        <div key={t.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold">{t.name}</div>
                            {t.descricao && <div className="text-xs text-gray-500 mt-0.5 truncate">{t.descricao}</div>}
                            {tasks > 0 && <div className="text-xs text-purple-600 mt-0.5">{tasks} tarefa(s) automática(s)</div>}
                          </div>
                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            <Badge color={t.status === 'Ativo' ? 'green' : 'gray'}>{t.status}</Badge>
                            <button onClick={() => setModal(t)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                            <button onClick={() => remove(t)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {modal && (
        <SimpleFormModal
          title={modal === 'new' ? 'Novo Tipo de Produção' : 'Editar Tipo'}
          fields={[
            { key: 'name', label: 'Nome', required: true, placeholder: 'Ex.: Licença de Construção' },
            { key: 'categoria', label: 'Categoria', type: 'select', required: true, default: 'projetos',
              options: PROD_CATEGORIES.map(c => ({ value: c.id, label: c.label })) },
            { key: 'descricao', label: 'Descrição', placeholder: 'Ex.: Aprovação prefeitura' },
            { key: 'autoTasksJson', label: 'Tarefas automáticas (JSON)', type: 'textarea', rows: 4,
              placeholder: '["Emitir ART","Protocolar na prefeitura"]',
              hint: 'Array de títulos. As tarefas são criadas automaticamente ao gerar um item desse tipo.' },
            ...(modal !== 'new' ? [
              { key: 'status', label: 'Status', type: 'select', default: 'Ativo',
                options: [{ value: 'Ativo', label: 'Ativo' }, { value: 'Inativo', label: 'Inativo' }] },
            ] : []),
          ]}
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSubmit={save}
          maxWidth="max-w-xl"
        />
      )}
    </SectionCard>
  );
}

// ═══════════════ 12. Modelos (Templates) ═══════════════

const TEMPLATE_VARIABLES = [
  '{{cliente}}', '{{valor_total}}', '{{data}}', '{{condicoes}}', '{{prazo}}', '{{endereco}}', '{{tabela_itens}}',
];

function TemplatesTab() {
  const [subTab, setSubTab] = useState('orcamento');
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/documents/templates?tipo=${subTab}`);
      setItems(r.data);
    } catch { setItems([]); } finally { setLoading(false); }
  }, [subTab]);
  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    const payload = {
      name: form.name,
      tipo: subTab,
      corpo: form.corpo,
      observacoes: form.observacoes || null,
    };
    if (modal && modal !== 'new') await api.put(`/documents/templates/${modal.id}`, payload);
    else await api.post('/documents/templates', payload);
    load();
  };

  const remove = async (t) => {
    if (!confirm(`Excluir modelo "${t.name}"?`)) return;
    await api.delete(`/documents/templates/${t.id}`);
    load();
  };

  return (
    <SectionCard
      title={null}
      right={<AccentButton onClick={() => setModal('new')}>Novo Modelo</AccentButton>}
    >
      {/* Sub-tabs */}
      <div className="flex items-center gap-6 border-b border-gray-100 -mx-6 px-6 -mt-6 pt-2 mb-4">
        {[
          { id: 'orcamento', label: 'Orçamentos' },
          { id: 'contrato',  label: 'Contratos' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSubTab(s.id)}
            className={`pb-3 text-sm font-semibold transition border-b-2 ${
              subTab === s.id ? 'text-erplus-accent border-erplus-accent' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Variables pills */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <span className="text-xs font-semibold text-gray-500">Modelos com variáveis:</span>
        {TEMPLATE_VARIABLES.map((v) => (
          <code key={v} className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{v}</code>
        ))}
      </div>

      {loading ? <div className="py-12 text-center text-gray-400">Carregando...</div>
        : items.length === 0 ? <EmptyState label={`Nenhum modelo de ${subTab === 'orcamento' ? 'orçamento' : 'contrato'}`} />
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((t) => (
              <div key={t.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition">
                <div className="flex items-start justify-between mb-3">
                  <Badge color={subTab === 'orcamento' ? 'rose' : 'blue'}>{subTab === 'orcamento' ? 'Orçamento' : 'Contrato'}</Badge>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setModal(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={13} /></button>
                    <button onClick={() => remove(t)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                  </div>
                </div>
                <h3 className="text-sm font-bold mb-3">{t.name}</h3>
                <pre className="text-[11px] font-mono text-gray-600 bg-gray-50 rounded-lg p-3 max-h-24 overflow-hidden relative whitespace-pre-wrap">
                  {(t.corpo || '').slice(0, 200)}
                  {(t.corpo || '').length > 200 && '...'}
                </pre>
                <button
                  onClick={() => setPreview(t)}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Eye size={12} /> Preview
                </button>
              </div>
            ))}
          </div>
        )}

      {modal && (
        <SimpleFormModal
          title={modal === 'new' ? `Novo Modelo de ${subTab === 'orcamento' ? 'Orçamento' : 'Contrato'}` : 'Editar Modelo'}
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'corpo', label: `Corpo (pode usar ${TEMPLATE_VARIABLES.slice(0, 3).join(', ')}…)`, type: 'textarea', rows: 12 },
            { key: 'observacoes', label: 'Observações', type: 'textarea', rows: 2 },
          ]}
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSubmit={save}
          maxWidth="max-w-2xl"
        />
      )}

      {preview && (
        <Modal title={`Preview — ${preview.name}`} onClose={() => setPreview(null)} maxWidth="max-w-3xl">
          <pre className="text-sm font-mono text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">{preview.corpo || '(vazio)'}</pre>
        </Modal>
      )}
    </SectionCard>
  );
}

// ═══════════════ ConfigPage ═══════════════

const TABS = [
  { id: 'empresa',          label: 'Empresa',              icon: Building2,      Component: EmpresaTab },
  { id: 'users-perms',      label: 'Usuários & Permissões',icon: Users,          Component: UsersPermissionsTab },
  { id: 'contact-types',    label: 'Tipo de Contatos',     icon: UserCog,        Component: ContactTypesTab },
  { id: 'business-types',   label: 'Tipos de Negócio',     icon: Tag,            Component: BusinessTypesTab },
  { id: 'services',         label: 'Produtos & Serviços',  icon: Briefcase,      Component: ServicesTab },
  { id: 'cost-centers',     label: 'Centro de Custos',     icon: DollarSign,     Component: CostCentersTab },
  { id: 'pipelines',        label: 'Negociações',          icon: TrendingUp,     Component: PipelinesTab },
  { id: 'automations',      label: 'Automações',           icon: SettingsIcon,   Component: AutomationsTab },
  { id: 'diligences',       label: 'Diligências',          icon: ClipboardCheck, Component: DiligencesTab },
  { id: 'briefings',        label: 'Briefings',            icon: ClipboardList,  Component: BriefingsTab },
  { id: 'production-types', label: 'Tipos de Produção',    icon: Layers,         Component: ProductionTypesTab },
  { id: 'templates',        label: 'Modelos',              icon: FileText,       Component: TemplatesTab },
];

export default function ConfigPage() {
  const [tab, setTab] = useState('empresa');
  const Active = TABS.find((t) => t.id === tab)?.Component ?? EmpresaTab;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-erplus-text">Configurações</h1>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <nav className="lg:w-64 lg:shrink-0">
          <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100 space-y-0.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition ${
                    active
                      ? 'bg-rose-50 text-erplus-accent font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="flex-1 truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <Active />
        </main>
      </div>
    </div>
  );
}
