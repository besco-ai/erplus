import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, MessageSquare, Activity, Printer } from 'lucide-react';
import api from '../../services/api';

const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR');

const STATUS_COLORS = {
  Aberto: 'bg-blue-50 text-blue-600',
  'Em andamento': 'bg-amber-50 text-amber-600',
  Resolvido: 'bg-green-50 text-green-600',
  Fechado: 'bg-gray-100 text-gray-500',
};
const PRIORITY_COLORS = {
  Baixa: 'bg-gray-100 text-gray-600',
  Normal: 'bg-blue-50 text-blue-600',
  Alta: 'bg-amber-50 text-amber-600',
  Urgente: 'bg-red-50 text-red-600',
};

export default function SuporteDashboardPage() {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/reports/support');
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-erplus-text">Suporte — Dashboard</h1>
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
          { label: 'Total de chamados', value: d.totalTickets, icon: MessageSquare, color: 'text-erplus-text' },
          { label: 'Abertos', value: d.openTickets, icon: AlertTriangle, color: 'text-blue-500' },
          { label: 'Em andamento', value: d.inProgressTickets, icon: Activity, color: 'text-amber-500' },
          { label: 'Resolvidos', value: d.resolvedTickets, icon: CheckCircle2, color: 'text-green-500' },
          {
            label: 'Tempo médio',
            value: d.avgResolutionDays != null ? `${d.avgResolutionDays} d` : '—',
            sub: 'de resolução',
            icon: Clock,
            color: 'text-gray-600',
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

      {d.urgentOpen > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
          <div className="text-sm font-semibold text-red-700">
            {d.urgentOpen} chamado{d.urgentOpen !== 1 ? 's' : ''} urgente{d.urgentOpen !== 1 ? 's' : ''} em aberto
          </div>
        </div>
      )}

      {/* Row 2: By status / priority / category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Por status</h3>
          {!d.byStatus?.length ? (
            <p className="text-xs text-gray-300 py-4">Sem chamados</p>
          ) : (
            <div className="space-y-2">
              {d.byStatus.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                  <span className="text-sm font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Por prioridade</h3>
          {!d.byPriority?.length ? (
            <p className="text-xs text-gray-300 py-4">Sem chamados</p>
          ) : (
            <div className="space-y-2">
              {d.byPriority.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${PRIORITY_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                  <span className="text-sm font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Por categoria</h3>
          {!d.byCategory?.length ? (
            <p className="text-xs text-gray-300 py-4">Sem chamados</p>
          ) : (
            <div className="space-y-2">
              {d.byCategory.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-xs font-semibold text-gray-700">{s.status}</span>
                  <span className="text-sm font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Recent open tickets */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Chamados em aberto mais recentes</h3>
        {!d.recentOpen?.length ? (
          <p className="text-center py-8 text-gray-300 text-sm">Nenhum chamado em aberto</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                <th className="text-left py-2">Título</th>
                <th className="text-left py-2">Categoria</th>
                <th className="text-left py-2">Prioridade</th>
                <th className="text-left py-2">Status</th>
                <th className="text-right py-2">Criado</th>
              </tr>
            </thead>
            <tbody>
              {d.recentOpen.map((t) => (
                <tr key={t.id} className="border-b border-gray-50">
                  <td className="py-2.5 font-medium">{t.title}</td>
                  <td className="py-2.5 text-gray-600">{t.category}</td>
                  <td className="py-2.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[t.priority] || 'bg-gray-100 text-gray-600'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-xs text-gray-400">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
