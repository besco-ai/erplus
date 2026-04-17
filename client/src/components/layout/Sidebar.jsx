import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, TrendingUp, DollarSign, Folder,
  CheckSquare, Settings, HelpCircle, LogOut, ChevronRight, ChevronLeft,
  Briefcase, FileText,
} from 'lucide-react';
import useAuthStore from '../../hooks/useAuthStore';

const menuSections = [
  {
    title: 'Meu Espaço',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { id: 'agenda', label: 'Agenda', icon: Calendar, path: '/agenda' },
      { id: 'contatos', label: 'Contatos', icon: Users, path: '/contatos' },
      { id: 'atas', label: 'Atas de Reuniões', icon: FileText, path: '/atas' },
      { id: 'negociacoes', label: 'Minhas Negociações', icon: TrendingUp, path: '/negociacoes' },
      { id: 'producao', label: 'Minha Produção', icon: Folder, path: '/producao' },
      { id: 'planejamentos', label: 'Meus Planejamentos', icon: Briefcase, path: '/planejamentos' },
      { id: 'tarefas', label: 'Minhas Tarefas', icon: CheckSquare, path: '/tarefas' },
    ],
  },
  {
    title: 'Administrativo',
    icon: Briefcase,
    collapsible: true,
    items: [
      { id: 'financeiro', label: 'Financeiro', path: '/financeiro' },
      { id: 'equipe', label: 'Equipe', path: '/equipe' },
    ],
  },
  {
    title: 'Comercial',
    icon: TrendingUp,
    collapsible: true,
    items: [
      { id: 'pipeline', label: 'Pipeline', path: '/comercial' },
      { id: 'orcamentos', label: 'Orçamentos', path: '/orcamentos' },
      { id: 'contratos', label: 'Contratos', path: '/contratos' },
    ],
  },
  {
    title: 'Produção',
    icon: Folder,
    collapsible: true,
    items: [
      { id: 'empreendimentos', label: 'Empreendimentos', path: '/empreendimentos' },
      { id: 'proj-producao', label: 'Produção', path: '/prod-geral' },
    ],
  },
  {
    title: 'Suporte',
    icon: HelpCircle,
    collapsible: true,
    items: [
      { id: 'tickets', label: 'Tickets', path: '/suporte' },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

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

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {menuSections.map((section) => (
          <div key={section.title} className="mb-1">
            {section.collapsible ? (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-400 hover:bg-white/5 transition"
              >
                {section.icon && <section.icon size={18} />}
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{section.title}</span>
                    <ChevronRight
                      size={14}
                      className={`transition-transform ${openSections[section.title] ? 'rotate-90' : ''}`}
                    />
                  </>
                )}
              </button>
            ) : (
              !collapsed && (
                <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </div>
              )
            )}

            {(!section.collapsible || openSections[section.title]) &&
              section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition mb-0.5 ${
                      isActive
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    {Icon && <Icon size={18} />}
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => navigate('/configuracoes')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 transition"
        >
          <Settings size={18} />
          {!collapsed && <span>Configurações</span>}
        </button>
        <button
          onClick={() => navigate('/ajuda')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 transition"
        >
          <HelpCircle size={18} />
          {!collapsed && <span>Ajuda</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 transition"
        >
          <LogOut size={18} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
