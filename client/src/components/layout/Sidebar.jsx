import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LayoutGrid, Calendar, Users, TrendingUp, Folder,
  CheckSquare, Settings, HelpCircle, LogOut, ChevronRight, ChevronLeft,
  Briefcase, FileText,
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';

const menuSections = [
  {
    title: 'Meu Espaço',
    icon: LayoutGrid,
    defaultOpen: true,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { id: 'agenda', label: 'Agenda', icon: Calendar, path: '/agenda' },
      { id: 'contatos', label: 'Contatos', icon: Users, path: '/contatos' },
      { id: 'atas', label: 'Atas de Reuniões', icon: FileText, path: '/atas' },
      { id: 'negociacoes', label: 'Minhas Negociações', icon: TrendingUp, path: '/negociacoes' },
      { id: 'minha-producao', label: 'Minha Produção', icon: Folder, path: '/minha-producao' },
      { id: 'planejamentos', label: 'Meus Planejamentos', icon: Briefcase, path: '/planejamentos' },
      { id: 'tarefas', label: 'Minhas Tarefas', icon: CheckSquare, path: '/tarefas' },
    ],
  },
  {
    title: 'Administrativo',
    icon: Briefcase,
    items: [
      { id: 'administrativo-dashboard', label: 'Dashboard', path: '/administrativo' },
      { id: 'financeiro', label: 'Financeiro', path: '/financeiro' },
      { id: 'cotacoes', label: 'Cotações', path: '/cotacoes' },
      { id: 'administrativo-producao', label: 'Produção', path: '/administrativo/producao' },
      { id: 'administrativo-tarefas', label: 'Tarefas', path: '/administrativo/tarefas' },
    ],
  },
  {
    title: 'Comercial',
    icon: TrendingUp,
    items: [
      { id: 'comercial-dashboard', label: 'Dashboard', path: '/comercial/dashboard' },
      { id: 'negociacoes-comercial', label: 'Negociações', path: '/comercial' },
      { id: 'orcamentos', label: 'Orçamentos', path: '/orcamentos' },
      { id: 'contratos', label: 'Contratos', path: '/contratos' },
    ],
  },
  {
    title: 'Produção',
    icon: Folder,
    items: [
      { id: 'producao-dashboard', label: 'Dashboard', path: '/producao' },
      { id: 'empreendimentos', label: 'Empreendimentos', path: '/empreendimentos' },
      { id: 'producao-revisao', label: 'Revisão Técnica', path: '/producao/revisao-tecnica' },
      { id: 'producao-licenciamentos', label: 'Licenciamentos', path: '/producao/licenciamentos' },
      { id: 'producao-design', label: 'Design Criativo', path: '/producao/design' },
      { id: 'producao-projetos', label: 'Projetos', path: '/producao/projetos' },
      { id: 'producao-incorporacoes', label: 'Incorporações', path: '/producao/incorporacoes' },
      { id: 'producao-supervisao', label: 'Supervisão', path: '/producao/supervisao' },
      { id: 'producao-vistorias', label: 'Vistorias', path: '/producao/vistorias' },
      { id: 'producao-averbacoes', label: 'Averbações', path: '/producao/averbacoes' },
    ],
  },
  {
    title: 'Suporte',
    icon: HelpCircle,
    items: [
      { id: 'suporte-dashboard', label: 'Dashboard', path: '/suporte/dashboard' },
      { id: 'chamados', label: 'Chamados', path: '/suporte' },
    ],
  },
];

// Inicializa quais grupos começam abertos: Meu Espaço + o grupo que contém a rota ativa.
function initialOpenSections(pathname) {
  const open = {};
  for (const section of menuSections) {
    if (section.defaultOpen) open[section.title] = true;
    if (section.items.some((i) => i.path === pathname)) open[section.title] = true;
  }
  return open;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();
  const [openSections, setOpenSections] = useState(() => initialOpenSections(location.pathname));
  const [commercialPipelines, setCommercialPipelines] = useState([]);

  // Busca pipelines do módulo Comercial para renderizar como sub-items
  // dinâmicos abaixo de "Negociações". Silencioso em caso de erro.
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/commercial/pipelines');
        if (Array.isArray(r.data)) setCommercialPipelines(r.data);
      } catch {
        /* silent */
      }
    })();
  }, []);

  // Auto-abre o grupo da rota ativa quando muda a rota
  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev };
      for (const section of menuSections) {
        if (section.items.some((i) => i.path === location.pathname)) {
          next[section.title] = true;
        }
      }
      return next;
    });
  }, [location.pathname]);

  const toggleSection = (title) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="h-screen flex flex-col transition-all duration-200"
      style={{
        width: collapsed ? 64 : 240,
        background: '#1A1A1A',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-erplus-accent text-white flex items-center justify-center font-black text-xs">
              E+
            </div>
            <span className="font-black text-lg">ERPlus</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-white/10 transition"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Menu — todas as seções são colapsáveis */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {menuSections.map((section) => {
          const isOpen = !!openSections[section.title];
          const SectionIcon = section.icon;
          return (
            <div key={section.title} className="mb-1">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/5 transition"
                title={collapsed ? section.title : undefined}
              >
                {SectionIcon && <SectionIcon size={18} />}
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{section.title}</span>
                    <ChevronRight
                      size={14}
                      className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    />
                  </>
                )}
              </button>

              {isOpen && !collapsed && (
                <div className="ml-1 mt-0.5 border-l border-white/5 pl-2">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                      <div key={item.id}>
                        <button
                          onClick={() => navigate(item.path)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition mb-0.5 ${
                            isActive
                              ? 'bg-white/10 text-white font-semibold'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {Icon ? <Icon size={16} /> : <span className="w-4" />}
                          <span>{item.label}</span>
                        </button>
                        {section.title === 'Comercial' && item.id === 'negociacoes-comercial' && (
                          <div className="ml-5 border-l border-white/5 pl-2">
                            {commercialPipelines.map((p) => {
                              const path = `/comercial?pipeline=${p.id}`;
                              const activePipe = location.pathname === '/comercial' &&
                                new URLSearchParams(location.search).get('pipeline') === String(p.id);
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => navigate(path)}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition mb-0.5 ${
                                    activePipe
                                      ? 'bg-white/10 text-white font-semibold'
                                      : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                  }`}
                                >
                                  <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                                  <span className="truncate">{p.name}</span>
                                </button>
                              );
                            })}
                            <button
                              onClick={() => navigate('/comercial?createPipeline=1')}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-white/5 hover:text-erplus-accent transition mb-0.5 italic"
                            >
                              <span className="w-3 h-3 rounded-sm border border-dashed border-current flex items-center justify-center text-[10px] leading-none">+</span>
                              <span>Criar pipeline</span>
                            </button>
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

      {/* Footer — ações fixas */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => navigate('/configuracoes')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
            location.pathname === '/configuracoes'
              ? 'bg-white/10 text-white font-semibold'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
          title={collapsed ? 'Configurações' : undefined}
        >
          <Settings size={18} />
          {!collapsed && <span>Configurações</span>}
        </button>
        <button
          onClick={() => navigate('/ajuda')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
            location.pathname === '/ajuda'
              ? 'bg-white/10 text-white font-semibold'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
