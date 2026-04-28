import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LayoutGrid, Calendar, Users, TrendingUp, Folder,
  CheckSquare, Settings, HelpCircle, LogOut, ChevronRight, ChevronLeft,
  Briefcase, FileText,
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';

// Categorias de produção — sub-items de Empreendimentos (espelha App.jsx)
const PRODUCTION_CATEGORIES = [
  { slug: 'revisao-tecnica',  label: 'Revisão Técnica',  color: '#8B5CF6' },
  { slug: 'licenciamentos',   label: 'Licenciamentos',   color: '#F59E0B' },
  { slug: 'design',           label: 'Design Criativo',  color: '#EC4899' },
  { slug: 'projetos',         label: 'Projetos',         color: '#7C3AED' },
  { slug: 'incorporacoes',    label: 'Incorporações',    color: '#3B82F6' },
  { slug: 'supervisao',       label: 'Supervisão',       color: '#06B6D4' },
  { slug: 'vistorias',        label: 'Vistorias',        color: '#10B981' },
  { slug: 'averbacoes',       label: 'Averbações',       color: '#F97316' },
];

const menuSections = [
  {
    title: 'Meu Espaço',
    icon: LayoutGrid,
    defaultOpen: true,
    items: [
      { id: 'dashboard',       label: 'Dashboard',           icon: LayoutDashboard, path: '/' },
      { id: 'agenda',          label: 'Agenda',              icon: Calendar,        path: '/agenda' },
      { id: 'contatos',        label: 'Contatos',            icon: Users,           path: '/contatos' },
      { id: 'atas',            label: 'Atas de Reuniões',    icon: FileText,        path: '/atas' },
      { id: 'negociacoes',     label: 'Minhas Negociações',  icon: TrendingUp,      path: '/negociacoes' },
      { id: 'minha-producao',  label: 'Minha Produção',      icon: Folder,          path: '/minha-producao' },
      { id: 'planejamentos',   label: 'Meus Planejamentos',  icon: Briefcase,       path: '/planejamentos' },
      { id: 'tarefas',         label: 'Minhas Tarefas',      icon: CheckSquare,     path: '/tarefas' },
    ],
  },
  {
    title: 'Administrativo',
    icon: Briefcase,
    items: [
      { id: 'administrativo-dashboard', label: 'Dashboard', path: '/administrativo' },
      { id: 'financeiro',               label: 'Financeiro', path: '/financeiro' },
      { id: 'cotacoes',                 label: 'Cotações',   path: '/cotacoes' },
      { id: 'administrativo-producao',  label: 'Produção',   path: '/administrativo/producao' },
      { id: 'administrativo-tarefas',   label: 'Tarefas',    path: '/administrativo/tarefas' },
    ],
  },
  {
    title: 'Comercial',
    icon: TrendingUp,
    items: [
      { id: 'comercial-dashboard',   label: 'Dashboard',    path: '/comercial/dashboard' },
      // "Negociações" é um grupo colapsável — sem path próprio (isGroup: true)
      { id: 'negociacoes-comercial', label: 'Negociações',  isGroup: true },
      { id: 'orcamentos',            label: 'Orçamentos',   path: '/orcamentos' },
      { id: 'contratos',             label: 'Contratos',    path: '/contratos' },
    ],
  },
  {
    title: 'Produção',
    icon: Folder,
    items: [
      { id: 'producao-dashboard', label: 'Dashboard',       path: '/producao' },
      { id: 'empreendimentos',    label: 'Empreendimentos', path: '/empreendimentos' },
    ],
  },
  {
    title: 'Suporte',
    icon: HelpCircle,
    items: [
      { id: 'suporte-dashboard', label: 'Dashboard', path: '/suporte/dashboard' },
      { id: 'chamados',          label: 'Chamados',  path: '/suporte' },
    ],
  },
];

// Inicializa quais seções começam abertas
function initialOpenSections(pathname) {
  const open = {};
  for (const section of menuSections) {
    if (section.defaultOpen) open[section.title] = true;
    if (section.items.some((i) => i.path && i.path === pathname)) open[section.title] = true;
    if (section.title === 'Comercial' && pathname === '/comercial') open[section.title] = true;
    if (section.title === 'Produção'  && pathname.startsWith('/producao/')) open[section.title] = true;
  }
  return open;
}

export default function Sidebar() {
  const [collapsed, setCollapsed]       = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { logout } = useAuthStore();

  const [openSections, setOpenSections] = useState(() => initialOpenSections(location.pathname));
  const [commercialPipelines, setCommercialPipelines] = useState([]);

  // "Negociações" começa aberto se o usuário já está em /comercial ou num pipeline
  const [negociacoesOpen, setNegociacoesOpen] = useState(
    () => location.pathname === '/comercial' || location.pathname.startsWith('/comercial/pipeline/')
  );

  // Busca os pipelines para popular o sub-menu de Negociações
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/commercial/pipelines');
        if (Array.isArray(r.data)) setCommercialPipelines(r.data);
      } catch { /* silent */ }
    })();
  }, []);

  // Auto-abre a seção e o grupo Negociações quando a rota muda
  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev };
      for (const section of menuSections) {
        if (section.items.some((i) => i.path && i.path === location.pathname)) {
          next[section.title] = true;
        }
        if (section.title === 'Comercial' && location.pathname === '/comercial') {
          next[section.title] = true;
        }
        if (section.title === 'Produção' && location.pathname.startsWith('/producao/')) {
          next[section.title] = true;
        }
      }
      return next;
    });

    // Abre Negociações automaticamente ao navegar para qualquer pipeline
    if (location.pathname === '/comercial' || location.pathname.startsWith('/comercial/pipeline/')) {
      setNegociacoesOpen(true);
    }
  }, [location.pathname]);

  const toggleSection = (title) =>
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));

  const handleLogout = () => { logout(); navigate('/login'); };

  // Pipeline ativo = está em /comercial/pipeline/:id
  const activePipelineId = location.pathname.startsWith('/comercial/pipeline/')
    ? location.pathname.split('/').pop()
    : null;

  // "Negociações" fica com indicador ativo quando qualquer pipeline está selecionado
  const negociacoesHasActive =
    location.pathname.startsWith('/comercial/pipeline/') ||
    location.pathname === '/comercial';

  return (
    <aside
      className="h-screen flex flex-col transition-all duration-200"
      style={{ width: collapsed ? 64 : 240, background: '#1A1A1A', color: '#fff', flexShrink: 0 }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-erplus-accent text-white flex items-center justify-center font-black text-xs">E+</div>
            <span className="font-black text-lg">ERPlus</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-white/10 transition">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* ── Menu ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {menuSections.map((section) => {
          const isOpen    = !!openSections[section.title];
          const SectionIcon = section.icon;

          return (
            <div key={section.title} className="mb-1">
              {/* Cabeçalho da seção */}
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/5 transition"
                title={collapsed ? section.title : undefined}
              >
                {SectionIcon && <SectionIcon size={18} />}
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{section.title}</span>
                    <ChevronRight size={14} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </>
                )}
              </button>

              {isOpen && !collapsed && (
                <div className="ml-1 mt-0.5 border-l border-white/5 pl-2">
                  {section.items.map((item) => {

                    // ── NEGOCIAÇÕES: grupo colapsável ─────────────────────────
                    if (item.isGroup && item.id === 'negociacoes-comercial') {
                      return (
                        <div key={item.id}>
                          {/* Cabeçalho do grupo — toggle, sem navegação */}
                          <button
                            onClick={() => setNegociacoesOpen((p) => !p)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition mb-0.5 ${
                              negociacoesHasActive
                                ? 'text-white font-semibold'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {/* Bullet indicador */}
                            <span className="w-4 flex items-center justify-center flex-shrink-0">
                              <span className={`w-1.5 h-1.5 rounded-full transition ${
                                negociacoesHasActive ? 'bg-erplus-accent' : 'bg-gray-600'
                              }`} />
                            </span>
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronRight
                              size={12}
                              className={`transition-transform flex-shrink-0 ${negociacoesOpen ? 'rotate-90' : ''}`}
                            />
                          </button>

                          {/* Lista de pipelines */}
                          {negociacoesOpen && (
                            <div className="ml-5 border-l border-white/5 pl-2">
                              {commercialPipelines.map((p) => {
                                const pPath    = `/comercial/pipeline/${p.id}`;
                                const isActive = activePipelineId === String(p.id);
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => navigate(pPath)}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition mb-0.5 ${
                                      isActive
                                        ? 'text-white font-semibold'
                                        : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition ${
                                      isActive ? 'bg-erplus-accent' : 'bg-gray-600'
                                    }`} />
                                    <span className="truncate">{p.name}</span>
                                  </button>
                                );
                              })}

                              {/* + Criar pipeline */}
                              <button
                                onClick={() => navigate('/comercial?createPipeline=1')}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-white/5 hover:text-erplus-accent transition mb-0.5 italic"
                              >
                                <span className="w-3 h-3 rounded-sm border border-dashed border-current flex items-center justify-center text-[10px] leading-none flex-shrink-0">+</span>
                                <span>Criar pipeline</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // ── ITEM NORMAL ───────────────────────────────────────────
                    const isActive = item.path ? location.pathname === item.path : false;
                    const Icon     = item.icon;

                    return (
                      <div key={item.id}>
                        <button
                          onClick={() => item.path && navigate(item.path)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition mb-0.5 ${
                            isActive
                              ? 'bg-white/10 text-white font-semibold'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {Icon ? <Icon size={16} /> : <span className="w-4" />}
                          <span>{item.label}</span>
                        </button>

                        {/* Sub-items: categorias de Produção sob Empreendimentos */}
                        {section.title === 'Produção' && item.id === 'empreendimentos' && (
                          <div className="ml-5 border-l border-white/5 pl-2">
                            {PRODUCTION_CATEGORIES.map((cat) => {
                              const catPath     = `/producao/${cat.slug}`;
                              const isActiveCat = location.pathname === catPath;
                              return (
                                <button
                                  key={cat.slug}
                                  onClick={() => navigate(catPath)}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition mb-0.5 ${
                                    isActiveCat
                                      ? 'bg-white/10 text-white font-semibold'
                                      : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                  }`}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ background: cat.color, opacity: isActiveCat ? 1 : 0.6 }}
                                  />
                                  <span className="truncate">{cat.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => navigate('/configuracoes')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
            location.pathname === '/configuracoes' ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
          title={collapsed ? 'Configurações' : undefined}
        >
          <Settings size={18} />
          {!collapsed && <span>Configurações</span>}
        </button>
        <button
          onClick={() => navigate('/ajuda')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
            location.pathname === '/ajuda' ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
          title={collapsed ? 'Ajuda' : undefined}
        >
          <HelpCircle size={18} />
          {!collapsed && <span>Ajuda</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition"
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
