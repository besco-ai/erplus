import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, DollarSign, CheckSquare, Calendar, Folder,
  FileText, ArrowRight, Clock, Star, Users, Activity,
  ArrowUpRight, ArrowDownRight, ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';
import PdfPreviewModal from '../../components/ui/PdfPreviewModal';

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // PDF preview state
  const [pdfModal, setPdfModal] = useState({ open: false, blobUrl: null, loading: false, error: null });
  const pdfFilename = `ERPlus_Dashboard_${new Date().toISOString().slice(0, 10)}.pdf`;

  const openPdfPreview = useCallback(async () => {
    setPdfModal({ open: true, blobUrl: null, loading: true, error: null });
    try {
      const response = await api.get('/reports/dashboard/pdf', { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPdfModal({ open: true, blobUrl, loading: false, error: null });
    } catch {
      setPdfModal({ open: true, blobUrl: null, loading: false, error: 'Erro ao gerar o relatório. Tente novamente.' });
    }
  }, []);

  const downloadPdf = useCallback(() => {
    if (!pdfModal.blobUrl) return;
    const a = document.createElement('a');
    a.href = pdfModal.blobUrl;
    a.download = pdfFilename;
    a.click();
  }, [pdfModal.blobUrl, pdfFilename]);

  const closePdfModal = useCallback(() => {
    setPdfModal((prev) => ({ ...prev, open: false }));
  }, []);

  // Role-based visibility flags.
  // Visitante: KPIs resumidos + agenda, sem financeiro/equipe/funil.
  // Colaborador: tudo menos o card de Financeiro (dados sensíveis).
  // Operador Master (default): tudo.
  const role = user?.role ?? 'Visitante';
  const canSeeFinance = role === 'Operador Master';
  const canSeeTeam = role === 'Operador Master' || role === 'Colaborador';
  const canSeeFunnel = role !== 'Visitante';
  const canSeeOverdueTasks = role !== 'Visitante';

  const today = new Date();
  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const dateStr = `${dayNames[today.getDay()]}, ${today.getDate()} de ${monthNames[today.getMonth()]} de ${today.getFullYear()}`;

  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await api.get('/reports/dashboard');
        setData(d);
      } catch {
        // Fallback: API might not be running yet
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Carregando dashboard...</div>;
  }

  // Fallback for when API is not available
  const d = data || {
    dealsCount: 0, dealsValue: 0, projectsCount: 0, projectsByStage: '',
    wonQuotes: 0, totalQuotes: 0, conversionRate: 0,
    pendingTasks: 0, overdueTasks: 0, todayEvents: 0,
    totalReceitas: 0, totalDespesas: 0, saldo: 0,
    funnel: [], todayEventsList: [], overdueTasksList: [],
    recentActivity: [], teamPerformance: [], projectStages: [],
  };

  return (
    <>
    <PdfPreviewModal
      open={pdfModal.open}
      onClose={closePdfModal}
      onDownload={downloadPdf}
      blobUrl={pdfModal.blobUrl}
      loading={pdfModal.loading}
      error={pdfModal.error}
      filename={pdfFilename}
    />
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-erplus-text">
            Olá, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-erplus-text-muted mt-1">{dateStr}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openPdfPreview}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-200 transition flex items-center gap-2"
          >
            <FileText size={14} />
            Relatório PDF
          </button>
          <div className="px-4 py-2 bg-erplus-accent-light rounded-lg text-sm font-semibold text-erplus-accent">
            {user?.role}
          </div>
        </div>
      </div>

      {/* KPI Cards — filtrados por role */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Negócios em aberto', value: d.dealsCount, sub: R$(d.dealsValue), color: 'text-erplus-accent', roles: ['Operador Master', 'Colaborador'] },
          { label: 'Empreendimentos', value: d.projectsCount, sub: d.projectsByStage || '—', color: 'text-blue-500', roles: ['Operador Master', 'Colaborador', 'Visitante'] },
          { label: 'Orçamentos ganhos', value: `${d.wonQuotes}/${d.totalQuotes}`, sub: `Taxa: ${d.conversionRate}%`, color: 'text-green-500', roles: ['Operador Master', 'Colaborador'] },
          { label: 'Tarefas pendentes', value: d.pendingTasks, sub: `${d.overdueTasks} atrasadas`, color: d.overdueTasks > 0 ? 'text-red-500' : 'text-amber-500', roles: ['Operador Master', 'Colaborador'] },
          { label: 'Agenda hoje', value: d.todayEvents, sub: 'eventos', color: 'text-blue-500', roles: ['Operador Master', 'Colaborador', 'Visitante'] },
        ]
          .filter((kpi) => kpi.roles.includes(role))
          .map((kpi, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{kpi.label}</div>
              <div className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-gray-400 mt-1">{kpi.sub}</div>
            </div>
          ))}
      </div>

      {/* Row 2: Agenda + Tarefas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Calendar size={15} className="text-erplus-accent" /> Agenda de hoje</h3>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{d.todayEventsList?.length || 0}</span>
          </div>
          {(!d.todayEventsList || d.todayEventsList.length === 0) ? (
            <p className="text-center py-8 text-gray-300 text-sm">Nenhum evento hoje.</p>
          ) : d.todayEventsList.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50">
              <div className="w-1 h-9 rounded-full flex-shrink-0" style={{ background: ev.color || '#C41E2A' }} />
              <div className="flex-1">
                <div className="text-sm font-semibold">{ev.title}</div>
                <div className="text-xs text-gray-400">{ev.time} · {ev.duration}min · <span className="capitalize">{ev.type}</span></div>
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </div>
          ))}
        </div>

        {canSeeOverdueTasks && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><CheckSquare size={15} className="text-erplus-accent" /> Tarefas</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.overdueTasks > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
                {d.pendingTasks} pendentes
              </span>
            </div>
            {d.overdueTasks > 0 && (
              <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">Atrasadas ({d.overdueTasks})</div>
            )}
            {(!d.overdueTasksList || d.overdueTasksList.length === 0) ? (
              <p className="text-center py-8 text-gray-300 text-sm">Tudo em dia!</p>
            ) : d.overdueTasksList.map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-2 border-b border-gray-50">
                <div className="w-4 h-4 rounded border-2 border-red-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-red-500">{t.title}</div>
                  <div className="text-xs text-gray-400">{t.due}</div>
                </div>
                <div className="w-5 h-5 rounded-full bg-erplus-accent text-white flex items-center justify-center text-[8px] font-bold">{t.responsibleId}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row 3: Funnel + Finance — apenas para quem pode ver */}
      {(canSeeFunnel || canSeeFinance) && (
        <div className={`grid grid-cols-1 gap-4 ${canSeeFunnel && canSeeFinance ? 'md:grid-cols-2' : ''}`}>
          {canSeeFunnel && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><TrendingUp size={15} className="text-erplus-accent" /> Funil de vendas</h3>
                <span className="text-xs font-semibold text-green-500">Conversão: {d.conversionRate}%</span>
              </div>
              {(!d.funnel || d.funnel.length === 0) ? (
                <p className="text-center py-8 text-gray-300 text-sm">Sem negócios no funil</p>
              ) : d.funnel.map((f, i) => {
                const maxVal = Math.max(1, ...d.funnel.map((x) => x.value));
                const pct = Math.max(10, (f.value / maxVal) * 100);
                return (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-32 text-xs font-medium text-gray-700 truncate">{f.stage}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div className="bg-erplus-accent h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 w-16 text-right">{f.count} neg.</div>
                    <div className="text-xs font-bold text-erplus-accent w-28 text-right">{R$(f.value)}</div>
                  </div>
                );
              })}
            </div>
          )}

          {canSeeFinance && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4"><DollarSign size={15} className="text-erplus-accent" /> Financeiro</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <ArrowUpRight size={16} className="text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-green-600">{R$(d.totalReceitas)}</div>
                  <div className="text-[10px] text-green-600 font-medium">Receitas</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <ArrowDownRight size={16} className="text-red-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-red-600">{R$(d.totalDespesas)}</div>
                  <div className="text-[10px] text-red-600 font-medium">Despesas</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <DollarSign size={16} className={`mx-auto mb-1 ${d.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <div className={`text-lg font-bold ${d.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{R$(d.saldo)}</div>
                  <div className="text-[10px] text-gray-500 font-medium">Saldo</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row 4: Team + Projects — Visitante vê só projects */}
      <div className={`grid grid-cols-1 gap-4 ${canSeeTeam ? 'md:grid-cols-2' : ''}`}>
        {canSeeTeam && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4"><Users size={15} className="text-erplus-accent" /> Performance da equipe</h3>
            {(d.teamPerformance || []).map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50">
                <div className="w-9 h-9 rounded-full bg-erplus-accent text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{p.initials}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.deals} negócios · {R$(p.value)}</div>
                </div>
                <div className="flex gap-3 text-center">
                  <div><div className="text-base font-bold text-green-500">{p.done}</div><div className="text-[9px] text-gray-400">feitas</div></div>
                  <div><div className={`text-base font-bold ${p.pending > 0 ? 'text-amber-500' : 'text-gray-300'}`}>{p.pending}</div><div className="text-[9px] text-gray-400">pend.</div></div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4"><Folder size={15} className="text-erplus-accent" /> Empreendimentos por etapa</h3>
          <div className="flex gap-2 mb-4">
            {(d.projectStages || []).map((s, i) => (
              <div key={i} className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                <div className={`text-2xl font-extrabold ${s.count > 0 ? 'text-erplus-accent' : 'text-gray-300'}`}>{s.count}</div>
                <div className="text-[10px] text-gray-500 mt-1 font-medium">{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
