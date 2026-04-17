import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import api from '../../services/api';

const CATEGORIES = [
  { key: 'licenciamentos', label: 'Licenciamentos', color: '#F59E0B', path: '/producao/licenciamentos' },
  { key: 'design', label: 'Design Criativo', color: '#EC4899', path: '/producao/design' },
  { key: 'projetos', label: 'Projetos', color: '#7C3AED', path: '/producao/projetos' },
  { key: 'revisao_tecnica', label: 'Revisão Técnica', color: '#8B5CF6', path: '/producao/revisao-tecnica' },
  { key: 'incorporacoes', label: 'Incorporações', color: '#3B82F6', path: '/producao/incorporacoes' },
  { key: 'supervisao', label: 'Supervisão', color: '#06B6D4', path: '/producao/supervisao' },
  { key: 'vistorias', label: 'Vistorias', color: '#10B981', path: '/producao/vistorias' },
  { key: 'averbacoes', label: 'Averbações', color: '#F97316', path: '/producao/averbacoes' },
];

/**
 * Placeholder do dashboard de Produção. Mostra a contagem de itens por categoria
 * e linka para a página de cada uma. Substituído por uma versão rica no Sprint 2.
 */
export default function ProductionDashboardPage() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/production/summary');
        setSummary(r.data);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold text-erplus-text">Produção — Dashboard</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const s = summary.find((x) => x.category === cat.key);
            const total = s?.total ?? 0;
            const done = s?.done ?? 0;
            return (
              <Link
                key={cat.key}
                to={cat.path}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:border-erplus-accent/50 hover:shadow-sm transition group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{cat.label}</span>
                </div>
                <div className="text-3xl font-extrabold text-erplus-text">{total}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {done} finalizados
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-erplus-accent font-semibold opacity-0 group-hover:opacity-100 transition">
                  Ver <ArrowRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
