import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, CheckCircle2, XCircle, Users, FileText } from 'lucide-react';
import api from '../../services/api';

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const STATUS_COLORS = {
  // quotes
  Rascunho: 'bg-gray-100 text-gray-600',
  Enviado: 'bg-blue-50 text-blue-600',
  Aprovado: 'bg-green-50 text-green-600',
  Recusado: 'bg-red-50 text-red-600',
  // contracts
  Vigente: 'bg-green-50 text-green-600',
  Encerrado: 'bg-gray-100 text-gray-600',
  Cancelado: 'bg-red-50 text-red-600',
  Suspenso: 'bg-amber-50 text-amber-600',
  // deals
  Ativo: 'bg-blue-50 text-blue-600',
  Ganho: 'bg-green-50 text-green-600',
  Perdido: 'bg-red-50 text-red-600',
  Congelado: 'bg-gray-100 text-gray-600',
  Inativo: 'bg-gray-100 text-gray-500',
};

export default function ComercialDashboardPage() {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/reports/commercial');
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
      <h1 className="text-xl font-extrabold text-erplus-text">Comercial — Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Negócios ativos', value: d.activeDeals, sub: R$(d.totalValue), icon: TrendingUp, color: 'text-erplus-accent' },
          { label: 'Negócios ganhos', value: d.wonDeals, sub: `${d.lostDeals} perdidos`, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Ticket médio', value: R$(d.avgDealValue), sub: 'por negócio ativo', icon: DollarSign, color: 'text-blue-500' },
          { label: 'Conversão', value: `${d.conversionRate}%`, sub: `${d.approvedQuotes}/${d.totalQuotes} orçamentos`, icon: FileText, color: 'text-amber-500' },
          { label: 'Contratos vigentes', value: d.activeContracts, sub: R$(d.activeContractsValue), icon: CheckCircle2, color: 'text-green-500' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{kpi.label}</span>
              <kpi.icon size={14} className="text-gray-300" />
            </div>
            <div className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-gray-400 mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Funnel + Quotes by status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-erplus-accent" /> Funil de vendas
          </h3>
          {!d.funnel?.length ? (
            <p className="text-center py-8 text-gray-300 text-sm">Sem negócios no funil</p>
          ) : (
            d.funnel.map((f, i) => {
              const maxVal = Math.max(1, ...d.funnel.map((x) => x.value));
              const pct = Math.max(6, (f.value / maxVal) * 100);
              return (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-40 text-xs font-medium text-gray-700 truncate">
                    <span className="text-gray-400">{f.pipeline}</span> · {f.stage}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className="bg-erplus-accent h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 w-14 text-right">{f.count}</div>
                  <div className="text-xs font-bold text-erplus-accent w-28 text-right">{R$(f.value)}</div>
                </div>
              );
            })
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
            <FileText size={15} className="text-erplus-accent" /> Orçamentos por status
          </h3>
          {!d.quotesByStatus?.length ? (
            <p className="text-center py-8 text-gray-300 text-sm">Sem orçamentos</p>
          ) : (
            <div className="space-y-2">
              {d.quotesByStatus.map((s, i) => {
                const cls = STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600';
                return (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls}`}>{s.status}</span>
                    <span className="text-sm font-bold text-erplus-text">{s.count}</span>
                  </div>
                );
              })}
              <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">Valor aprovado</span>
                <span className="font-bold text-green-600">{R$(d.approvedQuotesValue)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Top clients + Deals/Contracts by status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
            <Users size={15} className="text-erplus-accent" /> Top 5 clientes por valor
          </h3>
          {!d.topClients?.length ? (
            <p className="text-center py-8 text-gray-300 text-sm">Nenhum negócio registrado</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="text-left py-2">Cliente</th>
                  <th className="text-right py-2">Negócios</th>
                  <th className="text-right py-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {d.topClients.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 font-medium">Contato #{c.clientId}</td>
                    <td className="py-2 text-right text-gray-600">{c.dealsCount}</td>
                    <td className="py-2 text-right font-bold text-erplus-accent">{R$(c.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">Negócios por status</h3>
            {!d.dealsByStatus?.length ? (
              <p className="text-center py-4 text-gray-300 text-sm">—</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {d.dealsByStatus.map((s, i) => {
                  const cls = STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600';
                  return (
                    <div key={i} className={`px-3 py-1.5 rounded-full ${cls} text-xs font-semibold flex items-center gap-2`}>
                      {s.status} <span className="font-bold">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">Contratos por status</h3>
            {!d.contractsByStatus?.length ? (
              <p className="text-center py-4 text-gray-300 text-sm">Nenhum contrato</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {d.contractsByStatus.map((s, i) => {
                  const cls = STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600';
                  return (
                    <div key={i} className={`px-3 py-1.5 rounded-full ${cls} text-xs font-semibold flex items-center gap-2`}>
                      {s.status} <span className="font-bold">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
