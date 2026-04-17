import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../hooks/useAuthStore';

const demoAccounts = [
  {
    initials: 'GG',
    name: 'Giovanio Gonçalves',
    role: 'Operador Master',
    email: 'giovanio@egconsultorias.com.br',
    password: 'admin123',
  },
  {
    initials: 'CS',
    name: 'Carlos Silva',
    role: 'Colaborador',
    email: 'carlos@egconsultorias.com.br',
    password: 'user123',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate('/');
  };

  const handleQuickLogin = async (account) => {
    setEmail(account.email);
    setPassword(account.password);
    const success = await login(account.email, account.password);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-erplus-bg">
      <div className="w-full max-w-md p-10 bg-white rounded-2xl shadow-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-erplus-accent text-white flex items-center justify-center font-black text-sm">
              E+
            </div>
            <span className="text-2xl font-black text-erplus-text">ERPlus</span>
          </div>
          <p className="text-erplus-text-muted text-sm">
            EG Projetos & Consultorias
          </p>
        </div>

        {/* Quick access (demo) */}
        <div className="mb-6">
          <p className="text-[11px] font-bold text-erplus-text-muted uppercase tracking-wider mb-3">
            Acesso rápido (modo demo)
          </p>
          <div className="space-y-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickLogin(acc)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3 border border-erplus-border rounded-lg hover:border-erplus-accent hover:bg-erplus-accent-light/40 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 shrink-0 rounded-lg bg-erplus-accent text-white flex items-center justify-center font-bold text-sm">
                  {acc.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-erplus-text truncate">
                    {acc.name}
                  </div>
                  <div className="text-xs text-erplus-text-muted truncate">
                    {acc.role} · {acc.email}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-erplus-border"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-[11px] text-erplus-text-muted uppercase tracking-wider">
              ou entre com e-mail e senha
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-erplus-text-muted uppercase tracking-wide mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 border border-erplus-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/30 focus:border-erplus-accent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-erplus-text-muted uppercase tracking-wide mb-1.5">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-erplus-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/30 focus:border-erplus-accent transition"
            />
          </div>

          {error && (
            <div className="p-3 bg-erplus-accent-light text-erplus-accent text-sm rounded-lg font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-erplus-accent text-white rounded-lg font-bold text-sm hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-erplus-text-light mt-6">
          Sistema de gestão integrada
        </p>
      </div>
    </div>
  );
}
