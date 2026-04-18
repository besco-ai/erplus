import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, AlertTriangle, CalendarClock, Landmark, Printer } from 'lucide-react';
import api from '../../services/api';

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR');
const monthLabel = (yyyyMm) => {
  const [y, m] = yyyyMm.split('-');
  const names = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${names[parseInt(m, 10) - 1]}/${y.slice(2)}`;
};

export default function AdministrativoDashboardPage() {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/reports/admin');
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

  const maxMonth = Math.max(1, ...d.lastMonths.flatMap((m) => [m.receitas, m.despesas]));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-erplus-text">Administrativo — Dashboard</h1>
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
          { label: 'Receitas efetuadas', value: R$(d.receitas), icon: ArrowUpRight, color: 'text-green-500' },
          { label: 'Despesas efetuadas', value: R$(d.despesas), icon: ArrowDownRight, color: 'text-red-500' },
          { label: 'Saldo', value: R$(d.saldo), icon: DollarSign, color: d.saldo >= 0 ? 'text-green-500' : 'text-red-500' },
          { label: 'Saldo em bancos', value: R$(d.saldoBancos), icon: Landmark, color: 'text-blue-500' },
          {
            label: 'Vencidos',
            value: d.aReceberVencidos + d.aPagarVencidos,
            sub: `${d.aReceberVencidos} AR · ${d.aPagarVencidos} AP`,
            icon: AlertTriangle,
            color: (d.aReceberVencidos + d.aPagarVencidos) > 0 ? 'text-red-500' : 'text-gray-400',
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

      {/* Row 2: AR / AP summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Contas a receber</h3>
          <div className="text-3xl font-extrabold text-green-600">{R$(d.totalAReceber)}</div>
          <div className="text-xs text-gray-400 mt-1">
            {d.aReceberPendentes} pendentes · {d.aReceberVencidos} vencidos
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Próximos a receber</div>
            {!d.proximasReceber?.length ? (
              <p className="text-xs text-gray-300">Nenhum</p>
            ) : d.proximasReceber.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{r.descricao}</div>
                  <div className="text-xs text-gray-400">{formatDate(r.vencimento)}</div>
                </div>
                <span className="text-sm font-bold text-green-600 ml-3">{R$(r.valor)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Contas a pagar</h3>
          <div className="text-3xl font-extrabold text-red-600">{R$(d.totalAPagar)}</div>
          <div className="text-xs text-gray-400 mt-1">
            {d.aPagarPendentes} pendentes · {d.aPagarVencidos} vencidos
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Próximos a pagar</div>
            {!d.proximasPagar?.length ? (
              <p className="text-xs text-gray-300">Nenhum</p>
            ) : d.proximasPagar.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{p.descricao}</div>
                  <div className="text-xs text-gray-400">{formatDate(p.vencimento)}</div>
                </div>
                <span className="text-sm font-bold text-red-600 ml-3">{R$(p.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Monthly cashflow */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
          <CalendarClock size={15} className="text-erplus-accent" /> Receitas × Despesas — últimos 6 meses
        </h3>
        <div className="flex items-end gap-3 h-40">
          {d.lastMonths.map((m, i) => {
            const rH = Math.max(2, (m.receitas / maxMonth) * 140);
            const dH = Math.max(2, (m.despesas / maxMonth) * 140);
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="flex items-end gap-1 w-full justify-center h-36">
                  <div className="w-1/2 bg-green-400/80 rounded-t" style={{ height: rH }} title={R$(m.receitas)} />
                  <div className="w-1/2 bg-red-400/80 rounded-t" style={{ height: dH }} title={R$(m.despesas)} />
                </div>
                <div className="text-[10px] text-gray-400 mt-2 font-medium">{monthLabel(m.month)}</div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-400/80" /> Receitas</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400/80" /> Despesas</span>
        </div>
      </div>

      {/* Row 4: Cost centers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Receitas por centro de custo</h3>
          {!d.receitasByCostCenter?.length ? (
            <p className="text-xs text-gray-300 py-4">Sem receitas efetuadas</p>
          ) : d.receitasByCostCenter.map((cc) => {
            const max = Math.max(1, ...d.receitasByCostCenter.map((x) => x.value));
            const pct = Math.max(4, (cc.value / max) * 100);
            return (
              <div key={cc.costCenterId} className="py-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{cc.name}</span>
                  <span className="font-bold text-green-600">{R$(cc.value)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="bg-green-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Despesas por centro de custo</h3>
          {!d.despesasByCostCenter?.length ? (
            <p className="text-xs text-gray-300 py-4">Sem despesas efetuadas</p>
          ) : d.despesasByCostCenter.map((cc) => {
            const max = Math.max(1, ...d.despesasByCostCenter.map((x) => x.value));
            const pct = Math.max(4, (cc.value / max) * 100);
            return (
              <div key={cc.costCenterId} className="py-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{cc.name}</span>
                  <span className="font-bold text-red-600">{R$(cc.value)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="bg-red-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
