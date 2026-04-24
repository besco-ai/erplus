import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Folder, CheckCircle2, Activity, AlertTriangle, Circle, Clock, Printer } from 'lucide-react';
import api from '../../services/api';
import { fmtDate as formatDate } from '../../utils/date';

const CATEGORIES = [
  { key: 'revisao_tecnica', label: 'Revisão Técnica', color: '#8B5CF6', path: '/producao/revisao-tecnica' },
  { key: 'licenciamentos', label: 'Licenciamentos', color: '#F59E0B', path: '/producao/licenciamentos' },
  { key: 'design', label: 'Design Criativo', color: '#EC4899', path: '/producao/design' },
  { key: 'projetos', label: 'Projetos', color: '#7C3AED', path: '/producao/projetos' },
  { key: 'incorporacoes', label: 'Incorporações', color: '#3B82F6', path: '/producao/incorporacoes' },
  { key: 'supervisao', label: 'Supervisão', color: '#06B6D4', path: '/producao/supervisao' },
  { key: 'vistorias', label: 'Vistorias', color: '#10B981', path: '/producao/vistorias' },
  { key: 'averbacoes', label: 'Averbações', color: '#F97316', path: '/producao/averbacoes' },
];


export default function ProductionDashboardPage() {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/reports/production');
        setD(r.data);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;
  if (!d) return <div className="text-center py-12 text-gray-400">Sem dados</div>;

  const catMeta = (key) => CATEGORIES.find((c) => c.key === key);
  const progressPct = d.totalItems > 0 ? Math.round((d.finishedItems / d.totalItems) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-erplus-text">Produção — Dashboard</h1>
        <button
          onClick={() => window.print()}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 flex items-center gap-2 print:hidden"
        >
          <Printer size={14} /> Imprimir
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total de itens', value: d.totalItems, icon: Folder, color: 'text-erplus-text' },
          { label: 'Não iniciados', value: d.notStartedItems, icon: Circle, color: 'text-gray-500' },
          { label: 'Em andamento', value: d.inProgressItems, icon: Activity, color: 'text-amber-500' },
          { label: 'Finalizados', value: d.finishedItems, sub: `${progressPct}% do total`, icon: CheckCircle2, color: 'text-green-500' },
          {
            label: 'Vencidos',
            value: d.overdueItems,
            icon: AlertTriangle,
            color: d.overdueItems > 0 ? 'text-red-500' : 'text-gray-400',
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{kpi.label}</span>
              <kpi.icon size={14} className="text-gray-300" />
            </div>
            <div className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
            {kpi.sub && <div className="text-xs text-gray-400 mt-1">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => {
          const stats = d.byCategory.find((c) => c.category === cat.key);
          const total = stats?.total ?? 0;
          const done = stats?.done ?? 0;
          const overdue = stats?.overdue ?? 0;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <Link
              key={cat.key}
              to={cat.path}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:border-erplus-accent/50 hover:shadow-sm transition group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{cat.label}</span>
              </div>
              <div className="text-2xl font-extrabold text-erplus-text">{total}</div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                <span>{done} finalizados</span>
                {overdue > 0 && <span className="text-red-500 font-semibold">{overdue} vencidos</span>}
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-erplus-accent font-semibold opacity-0 group-hover:opacity-100 transition">
                Ver <ArrowRight size={12} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Overdue items */}
      {d.overdue && d.overdue.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-red-500" /> Itens vencidos ({d.overdueItems})
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                <th className="text-left py-2">Item</th>
                <th className="text-left py-2">Categoria</th>
                <th className="text-left py-2">Status</th>
                <th className="text-right py-2">Prazo</th>
              </tr>
            </thead>
            <tbody>
              {d.overdue.map((it) => {
                const meta = catMeta(it.category);
                return (
                  <tr key={it.id} className="border-b border-gray-50">
                    <td className="py-2.5 font-medium">{it.title}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        {meta && <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />}
                        {meta?.label ?? it.category}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-600 text-xs">{it.status}</td>
                    <td className="py-2.5 text-right text-red-500 font-semibold text-xs flex items-center justify-end gap-1">
                      <Clock size={12} /> {it.due ? formatDate(it.due) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
