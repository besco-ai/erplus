import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../hooks/useAuthStore';

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
