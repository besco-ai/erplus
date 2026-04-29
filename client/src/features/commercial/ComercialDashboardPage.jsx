import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import api from '../../services/api';
import PrintPreview from '../../components/ui/PrintPreview';

const R$ = (v) =>
  'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const QUOTE_STATUSES = [
  { key: 'Rascunho', label: 'RASCUNHO', bg: 'bg-gray-50',  text: 'text-gray-800', lc: 'text-gray-500' },
  { key: 'Enviado',  label: 'ENVIADO',  bg: 'bg-blue-50',  text: 'text-blue-700', lc: 'text-blue-400' },
  { key: 'Aprovado', label: 'APROVADO', bg: 'bg-green-50', text: 'text-green-700',lc: 'text-green-400'},
  { key: 'Recusado', label: 'RECUSADO', bg: 'bg-red-50',   text: 'text-red-600',  lc: 'text-red-400'  },
];

const STATUS_BADGE = {
  Ativo: 'text-green-600', Ganho: 'text-green-600',
  Perdido: 'text-red-500', Congelado: 'text-gray-500', Inativo: 'text-gray-400',
};

const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

// ─── Conteúdo do relatório imprimível ────────────────────────────────────────
function ComercialReport({ d }) {
  const quoteCount = (status) =>
    (d.quotesByStatus ?? []).find((s) => s.status === status)?.count ?? 0;

  return (
    <div className="p-10 text-gray-800 font-sans">

      {/* Cabeçalho do documento */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-200">
        <div>
          <div className="text-2xl font-black text-erplus-accent tracking-tight">ERPlus</div>
          <div className="text-xs text-gray-400 mt-0.5">Sistema de Gestão</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold text-gray-800">Relatório Comercial</div>
          <div className="text-xs text-gray-400 mt-1">{today}</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Negócios Ativos',  value: d.activeDeals,     color: 'text-gray-900' },
          { label: 'Ganhos',           value: d.wonDeals,        color: 'text-green-600' },
          { label: 'Perdidos',         value: d.lostDeals,       color: 'text-red-500' },
          { label: 'Taxa Conversão',   value: `${d.conversionRate}%`, color: 'text-blue-600' },
          { label: 'Valor Pipeline',   value: R$(d.totalValue),  color: 'text-red-500', small: true },
        ].map((k) => (
          <div key={k.label} className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">{k.label}</div>
            <div className={`font-extrabold ${k.small ? 'text-base' : 'text-2xl'} ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Negócios por Pipeline + Orçamentos */}
      <div className="grid grid-cols-5 gap-6 mb-8">

        {/* Negócios por Pipeline */}
        <div className="col-span-3">
          <div className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
            Negócios por Pipeline
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-1.5 font-semibold">Pipeline</th>
                <th className="text-center py-1.5 font-semibold">Negócios</th>
                <th className="text-right py-1.5 font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {(d.pipelineSummary ?? []).map((pl) => (
                <tr key={pl.pipelineName} className="border-b border-gray-50">
                  <td className="py-2.5 font-semibold text-gray-800">{pl.pipelineName}</td>
                  <td className="py-2.5 text-center text-gray-500">{pl.dealsCount}</td>
                  <td className="py-2.5 text-right font-bold text-red-500">{R$(pl.totalValue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td className="pt-3 font-bold text-gray-800">Total Ganhos</td>
                <td />
                <td className="pt-3 text-right font-extrabold text-green-600">{R$(0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Orçamentos */}
        <div className="col-span-2">
          <div className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
            Orçamentos
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {QUOTE_STATUSES.map(({ key, label, bg, text, lc }) => (
              <div key={key} className={`${bg} rounded-lg p-3 text-center`}>
                <div className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${lc}`}>{label}</div>
                <div className={`text-2xl font-extrabold ${text}`}>{quoteCount(key)}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-sm">
            <span className="font-bold text-gray-700">Total em Orçamentos</span>
            <span className="font-bold text-red-500">{R$(d.totalQuotesValue)}</span>
          </div>
        </div>
      </div>

      {/* Últimos Negócios */}
      <div>
        <div className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
          Últimos Negócios
        </div>
        {!(d.recentDeals?.length) ? (
          <p className="text-sm text-gray-400 py-4 text-center">Nenhum negócio registrado</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-1.5 font-semibold">Negócio</th>
                <th className="text-left py-1.5 font-semibold">Pipeline</th>
                <th className="text-right py-1.5 font-semibold">Valor</th>
                <th className="text-right py-1.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {d.recentDeals.map((deal) => (
                <tr key={deal.id} className="border-b border-gray-50">
                  <td className="py-2.5 text-gray-800">{deal.title}</td>
                  <td className="py-2.5 text-gray-500">{deal.pipelineName}</td>
                  <td className="py-2.5 text-right font-bold text-red-500">{R$(deal.value)}</td>
                  <td className={`py-2.5 text-right font-semibold ${STATUS_BADGE[deal.status] ?? 'text-gray-500'}`}>
                    {deal.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rodapé */}
      <div className="mt-10 pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-300">
        <span>ERPlus — Sistema de Gestão</span>
        <span>Gerado em {today}</span>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function ComercialDashboardPage() {
  const [d, setD]             = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/reports/commercial');
        setD(r.data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Carregando...</div>
  );
  if (!d) return (
    <div className="text-center py-12 text-gray-400 text-sm">Sem dados</div>
  );

  const quoteCount = (status) =>
    (d.quotesByStatus ?? []).find((s) => s.status === status)?.count ?? 0;

  return (
    <>
      {/* ── Pré-impressão full-screen ── */}
      {showPreview && (
        <PrintPreview title="Relatório Comercial" onClose={() => setShowPreview(false)}>
          <ComercialReport d={d} />
        </PrintPreview>
      )}

      <div className="space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-erplus-text">Comercial — Dashboard</h1>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-erplus-border rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <FileText size={14} className="text-gray-500" />
            Relatório PDF
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Negócios Ativos</div>
            <div className="text-3xl font-extrabold text-erplus-text">{d.activeDeals}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ganhos</div>
            <div className="text-3xl font-extrabold text-green-500">{d.wonDeals}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Perdidos</div>
            <div className="text-3xl font-extrabold text-red-500">{d.lostDeals}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Taxa Conversão</div>
            <div className="text-3xl font-extrabold text-blue-500">{d.conversionRate}%</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Valor Pipeline</div>
            <div className="text-2xl font-extrabold text-red-500">{R$(d.totalValue)}</div>
          </div>
        </div>

        {/* Negócios por Pipeline + Orçamentos */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-bold text-erplus-text mb-5">Negócios por Pipeline</h2>
            <div className="divide-y divide-gray-50">
              {(d.pipelineSummary ?? []).map((pl) => (
                <div key={pl.pipelineName} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-bold text-erplus-text">{pl.pipelineName}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {pl.dealsCount} {pl.dealsCount === 1 ? 'negócio ativo' : 'negócios ativos'}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-red-500">{R$(pl.totalValue)}</div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm font-bold text-erplus-text">Total Ganhos</div>
                <div className="text-sm font-bold text-green-600">{R$(0)}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-bold text-erplus-text mb-5">Orçamentos</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {QUOTE_STATUSES.map(({ key, label, bg, text, lc }) => (
                <div key={key} className={`${bg} rounded-lg p-4`}>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${lc}`}>{label}</div>
                  <div className={`text-3xl font-extrabold ${text}`}>{quoteCount(key)}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm font-bold text-erplus-text">Total em Orçamentos</span>
              <span className="text-sm font-bold text-red-500">{R$(d.totalQuotesValue)}</span>
            </div>
          </div>
        </div>

        {/* Últimos Negócios */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold text-erplus-text mb-5">Últimos Negócios</h2>
          {!(d.recentDeals?.length) ? (
            <p className="text-center py-8 text-gray-300 text-sm">Nenhum negócio registrado</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Negócio</th>
                  <th className="text-left py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pipeline</th>
                  <th className="text-right py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor</th>
                  <th className="text-right py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {d.recentDeals.map((deal) => (
                  <tr key={deal.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                    <td className="py-3 pr-4 text-sm text-erplus-text">{deal.title}</td>
                    <td className="py-3 pr-4 text-sm text-gray-400">{deal.pipelineName}</td>
                    <td className="py-3 pr-4 text-right text-sm font-bold text-red-500">{R$(deal.value)}</td>
                    <td className={`py-3 text-right text-sm font-semibold ${STATUS_BADGE[deal.status] ?? 'text-gray-500'}`}>
                      {deal.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
