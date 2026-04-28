import { useEffect, useState } from 'react';
import {
  TrendingUp, DollarSign, CheckSquare, Calendar, Folder,
  FileText, ArrowRight, Clock, Users, Activity,
  ArrowUpRight, ArrowDownRight, ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';
import PrintPreview from '../../components/ui/PrintPreview';

const ACTIVITY_ICON = {
  create:  { icon: ArrowRight,  bg: 'bg-blue-100',   color: 'text-blue-500'   },
  move:    { icon: ArrowRight,  bg: 'bg-blue-100',   color: 'text-blue-500'   },
  quote:   { icon: FileText,    bg: 'bg-red-100',    color: 'text-erplus-accent' },
  task:    { icon: CheckSquare, bg: 'bg-amber-100',  color: 'text-amber-500'  },
  event:   { icon: Calendar,    bg: 'bg-purple-100', color: 'text-purple-500' },
};

const R$ = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const DAY_NAMES   = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const MONTH_NAMES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

// ─── Conteúdo do relatório imprimível ────────────────────────────────────────
function DashboardReport({ d, user, role, dateStr }) {
  const canSeeFinance = role === 'Operador Master';
  const canSeeTeam    = role === 'Operador Master' || role === 'Colaborador';
  const canSeeFunnel  = role !== 'Visitante';

  return (
    <div className="p-10 text-gray-800 font-sans">

      {/* Cabeçalho do documento */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-200">
        <div>
          <div className="text-2xl font-black text-erplus-accent tracking-tight">ERPlus</div>
          <div className="text-xs text-gray-400 mt-0.5">Sistema de Gestão</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold text-gray-800">Relatório — Meu Espaço</div>
          <div className="text-xs text-gray-400 mt-1">{dateStr}</div>
          {user && <div className="text-xs text-gray-500 mt-0.5">{user.name} · {role}</div>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Negócios em aberto', value: d.dealsCount,   sub: R$(d.dealsValue),           color: 'text-erplus-accent', show: role !== 'Visitante' },
          { label: 'Empreendimentos',    value: d.projectsCount, sub: d.projectsByStage || '—',  color: 'text-blue-600',     show: true },
          { label: 'Orçamentos ganhos',  value: `${d.wonQuotes}/${d.totalQuotes}`, sub: `Taxa: ${d.conversionRate}%`, color: 'text-green-600', show: role !== 'Visitante' },
          { label: 'Tarefas pendentes',  value: d.pendingTasks, sub: `${d.overdueTasks} atrasadas`, color: d.overdueTasks > 0 ? 'text-red-500' : 'text-amber-500', show: role !== 'Visitante' },
          { label: 'Agenda hoje',        value: d.todayEvents,  sub: 'eventos',                  color: 'text-blue-600',     show: true },
        ].filter(k => k.show).map((k) => (
          <div key={k.label} className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">{k.label}</div>
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
            <div className="text-[10px] text-gray-400 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Agenda de hoje */}
      {d.todayEventsList?.length > 0 && (
        <div className="mb-8">
          <div className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
            Agenda de Hoje
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-1.5 font-semibold">Evento</th>
                <th className="text-left py-1.5 font-semibold">Horário</th>
                <th className="text-left py-1.5 font-semibold">Duração</th>
                <th className="text-left py-1.5 font-semibold">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {d.todayEventsList.map((ev) => (
                <tr key={ev.id} className="border-b border-gray-50">
                  <td className="py-2 font-medium text-gray-800">{ev.title}</td>
                  <td className="py-2 text-gray-500">{ev.time || '—'}</td>
                  <td className="py-2 text-gray-500">{ev.duration}min</td>
                  <td className="py-2 text-gray-500 capitalize">{ev.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tarefas atrasadas */}
      {role !== 'Visitante' && d.overdueTasksList?.length > 0 && (
        <div className="mb-8">
          <div className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
            Tarefas Atrasadas
            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              {d.overdueTasksList.length}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-1.5 font-semibold">Tarefa</th>
                <th className="text-left py-1.5 font-semibold">Vencimento</th>
              </tr>
            </thead>
            <tbody>
              {d.overdueTasksList.map((t) => (
                <tr key={t.id} className="border-b border-gray-50">
                  <td className="py-2 font-medium text-red-600">{t.title}</td>
                  <td className="py-2 text-gray-500">{t.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Funil de vendas */}
      {canSeeFunnel && d.funnel?.length > 0 && (
        <div className="mb-8">
          <div className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
            Funil de Vendas
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-1.5 font-semibold">Pipeline</th>
                <th className="text-left py-1.5 font-semibold">Etapa</th>
                <th className="text-center py-1.5 font-semibold">Negócios</th>
                <th className="text-right py-1.5 font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {d.funnel.map((f, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 text-gray-500">{f.pipeline}</td>
                  <td className="py-2 font-medium text-gray-800">{f.stage}</td>
                  <td className="py-2 text-center text-gray-500">{f.count}</td>
                  <td className="py-2 text-right font-bold text-erplus-accent">{R$(f.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Financeiro */}
      {canSeeFinance && (
        <div className="mb-8">
          <div className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">Financeiro</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-[10px] font-bold uppercase text-green-500 mb-1">Receitas</div>
              <div className="text-xl font-extrabold text-green-600">{R$(d.totalReceitas)}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-[10px] font-bold uppercase text-red-400 mb-1">Despesas</div>
              <div className="text-xl font-extrabold text-red-600">{R$(d.totalDespesas)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Saldo</div>
              <div className={`text-xl font-extrabold ${d.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {R$(d.saldo)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance da equipe */}
      {canSeeTeam && d.teamPerformance?.length > 0 && (
        <div className="mb-8">
          <div className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
            Performance da Equipe
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-1.5 font-semibold">Colaborador</th>
                <th className="text-center py-1.5 font-semibold">Negócios</th>
                <th className="text-right py-1.5 font-semibold">Valor</th>
                <th className="text-center py-1.5 font-semibold">Tarefas Feitas</th>
                <th className="text-center py-1.5 font-semibold">Pendentes</th>
              </tr>
            </thead>
            <tbody>
              {d.teamPerformance.map((p, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 font-medium text-gray-800">{p.name}</td>
                  <td className="py-2 text-center text-gray-500">{p.deals}</td>
                  <td className="py-2 text-right font-bold text-erplus-accent">{R$(p.value)}</td>
                  <td className="py-2 text-center text-green-600 font-bold">{p.done}</td>
                  <td className={`py-2 text-center font-bold ${p.pending > 0 ? 'text-amber-500' : 'text-gray-300'}`}>{p.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empreendimentos por etapa */}
      {d.projectStages?.length > 0 && (
        <div className="mb-8">
          <div className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
            Empreendimentos por Etapa
          </div>
          <div className="grid grid-cols-4 gap-3">
            {d.projectStages.map((s, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3 text-center">
                <div className={`text-2xl font-extrabold ${s.count > 0 ? 'text-erplus-accent' : 'text-gray-300'}`}>{s.count}</div>
                <div className="text-[10px] text-gray-500 mt-1 font-medium">{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div className="mt-10 pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-300">
        <span>ERPlus — Sistema de Gestão</span>
        <span>Gerado em {dateStr}</span>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const today      = new Date();
  const dateStr    = `${DAY_NAMES[today.getDay()]}, ${today.getDate()} de ${MONTH_NAMES[today.getMonth()]} de ${today.getFullYear()}`;
  const role       = user?.role ?? 'Visitante';

  const canSeeFinance      = role === 'Operador Master';
  const canSeeTeam         = role === 'Operador Master' || role === 'Colaborador';
  const canSeeFunnel       = role !== 'Visitante';
  const canSeeOverdueTasks = role !== 'Visitante';

  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await api.get('/reports/dashboard');
        setData(d);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Carregando dashboard...</div>
  );

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
      {/* ── Pré-impressão full-screen ── */}
      {showPreview && (
        <PrintPreview title="Relatório — Meu Espaço" onClose={() => setShowPreview(false)}>
          <DashboardReport d={d} user={user} role={role} dateStr={dateStr} />
        </PrintPreview>
      )}

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
              onClick={() => setShowPreview(true)}
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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Negócios em aberto', value: d.dealsCount,   sub: R$(d.dealsValue),                color: 'text-erplus-accent', roles: ['Operador Master','Colaborador'] },
            { label: 'Empreendimentos',    value: d.projectsCount, sub: d.projectsByStage || '—',        color: 'text-blue-500',     roles: ['Operador Master','Colaborador','Visitante'] },
            { label: 'Orçamentos ganhos',  value: `${d.wonQuotes}/${d.totalQuotes}`, sub: `Taxa: ${d.conversionRate}%`, color: 'text-green-500', roles: ['Operador Master','Colaborador'] },
            { label: 'Tarefas pendentes',  value: d.pendingTasks, sub: `${d.overdueTasks} atrasadas`,   color: d.overdueTasks > 0 ? 'text-red-500' : 'text-amber-500', roles: ['Operador Master','Colaborador'] },
            { label: 'Agenda hoje',        value: d.todayEvents,  sub: 'eventos',                       color: 'text-blue-500',     roles: ['Operador Master','Colaborador','Visitante'] },
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
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Calendar size={15} className="text-erplus-accent" /> Agenda de hoje
              </h3>
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {d.todayEventsList?.length || 0}
              </span>
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
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <CheckSquare size={15} className="text-erplus-accent" /> Tarefas
                </h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.overdueTasks > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
                  {d.pendingTasks} pendentes
                </span>
              </div>
              {d.overdueTasks > 0 && (
                <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">
                  Atrasadas ({d.overdueTasks})
                </div>
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
                  <div className="w-5 h-5 rounded-full bg-erplus-accent text-white flex items-center justify-center text-[8px] font-bold">
                    {t.responsibleId}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 3: Funil + Financeiro */}
        {(canSeeFunnel || canSeeFinance) && (
          <div className={`grid grid-cols-1 gap-4 ${canSeeFunnel && canSeeFinance ? 'md:grid-cols-2' : ''}`}>
            {canSeeFunnel && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <TrendingUp size={15} className="text-erplus-accent" /> Funil de vendas
                  </h3>
                  <span className="text-xs font-semibold text-green-500">Conversão: {d.conversionRate}%</span>
                </div>
                {(!d.funnel || d.funnel.length === 0) ? (
                  <p className="text-center py-8 text-gray-300 text-sm">Sem negócios no funil</p>
                ) : d.funnel.map((f, i) => {
                  const maxVal = Math.max(1, ...d.funnel.map((x) => x.value));
                  const pct    = Math.max(10, (f.value / maxVal) * 100);
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
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
                  <DollarSign size={15} className="text-erplus-accent" /> Financeiro
                </h3>
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

        {/* Row 4: Atividades Recentes */}
        {d.recentActivity?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
              <Activity size={15} className="text-erplus-accent" /> Atividades Recentes
            </h3>
            <div className="space-y-0">
              {d.recentActivity.map((a, i) => {
                const cfg  = ACTIVITY_ICON[a.type] ?? ACTIVITY_ICON.create;
                const Icon = cfg.icon;
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{a.text}</div>
                      <div className="text-xs text-gray-400">{a.date}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 5: Equipe + Empreendimentos */}
        <div className={`grid grid-cols-1 gap-4 ${canSeeTeam ? 'md:grid-cols-2' : ''}`}>
          {canSeeTeam && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
                <Users size={15} className="text-erplus-accent" /> Performance da equipe
              </h3>
              {(d.teamPerformance || []).map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50">
                  <div className="w-9 h-9 rounded-full bg-erplus-accent text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {p.initials}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.deals} negócios · {R$(p.value)}</div>
                  </div>
                  <div className="flex gap-3 text-center">
                    <div>
                      <div className="text-base font-bold text-green-500">{p.done}</div>
                      <div className="text-[9px] text-gray-400">feitas</div>
                    </div>
                    <div>
                      <div className={`text-base font-bold ${p.pending > 0 ? 'text-amber-500' : 'text-gray-300'}`}>{p.pending}</div>
                      <div className="text-[9px] text-gray-400">pend.</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
              <Folder size={15} className="text-erplus-accent" /> Empreendimentos por etapa
            </h3>
            <div className="flex gap-2">
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
