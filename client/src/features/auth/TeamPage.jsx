import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, X, Save, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';
import Select from '../../components/ui/Select';

const ROLES = ['Operador Master', 'Colaborador', 'Visitante'];

function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'Colaborador',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        const payload = { name: form.name, email: form.email, role: form.role };
        await api.put(`/identity/users/${user.id}`, payload);
      } else {
        await api.post('/identity/users', form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">E-mail *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
            />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Senha *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Perfil</label>
            <Select
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v })}
              options={ROLES}
              className="w-full"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-erplus-accent rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={14} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | user object
  const { user: currentUser, can } = useAuthStore();

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/identity/users');
      setUsers(data);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Tem certeza que deseja excluir ${name}?`)) return;
    try {
      await api.delete(`/identity/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir');
    }
  };

  const handleResetPassword = async (id, name) => {
    const newPassword = prompt(`Nova senha para ${name} (mínimo 6 caracteres):`);
    if (!newPassword) return;
    try {
      await api.post(`/identity/users/${id}/reset-password`, { newPassword });
      alert('Senha redefinida com sucesso');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao redefinir senha');
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.put(`/identity/users/${user.id}`, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao alterar status');
    }
  };

  const roleBadge = (role) => {
    const colors = {
      'Operador Master': 'bg-red-50 text-red-600',
      Colaborador: 'bg-blue-50 text-blue-600',
      Visitante: 'bg-gray-100 text-gray-600',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[role] || colors.Visitante}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-erplus-text">Equipe</h1>
          <p className="text-sm text-erplus-text-muted mt-1">{users.length} usuário(s) cadastrado(s)</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-erplus-accent text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
        >
          <Plus size={16} />
          Novo Usuário
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-sm border border-erplus-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-erplus-border">
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Usuário</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">E-mail</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Perfil</th>
              <th className="text-center px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Carregando...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-erplus-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {u.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{u.name}</div>
                      {u.lastLoginAt && (
                        <div className="text-xs text-gray-400">
                          Último login: {new Date(u.lastLoginAt).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{u.email}</td>
                <td className="px-5 py-3.5">{roleBadge(u.role)}</td>
                <td className="px-5 py-3.5 text-center">
                  <button
                    onClick={() => toggleActive(u)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition ${
                      u.isActive
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {u.isActive ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setModal(u)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => handleResetPassword(u.id, u.name)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Redefinir senha"
                    >
                      <RotateCcw size={15} />
                    </button>
                    {u.id !== currentUser?.userId && (
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <UserModal
          user={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchUsers}
        />
      )}
    </div>
  );
}
