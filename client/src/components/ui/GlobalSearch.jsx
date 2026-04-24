import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, Calendar, Users, FileText,
  TrendingUp, Folder, CheckSquare, DollarSign, ShoppingCart,
  File, Building2, Settings, HelpCircle, Briefcase,
  ClipboardList, BarChart2, X,
} from 'lucide-react';

// ─── Índice estático de navegação ────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard',          path: '/',                    icon: LayoutDashboard, category: 'Páginas', desc: 'Visão geral do sistema' },
  { label: 'Agenda',             path: '/agenda',              icon: Calendar,        category: 'Páginas', desc: 'Eventos e compromissos' },
  { label: 'Contatos',           path: '/contatos',            icon: Users,           category: 'Páginas', desc: 'Clientes e parceiros' },
  { label: 'Atas de Reuniões',   path: '/atas',                icon: FileText,        category: 'Páginas', desc: 'Registros de reuniões' },
  { label: 'Minhas Negociações', path: '/negociacoes',         icon: TrendingUp,      category: 'Páginas', desc: 'Pipeline de vendas próprio' },
  { label: 'Minha Produção',     path: '/minha-producao',      icon: Folder,          category: 'Páginas', desc: 'Itens de produção' },
  { label: 'Planejamentos',      path: '/planejamentos',       icon: ClipboardList,   category: 'Páginas', desc: 'Planejamento de tarefas' },
  { label: 'Minhas Tarefas',     path: '/tarefas',             icon: CheckSquare,     category: 'Páginas', desc: 'Tarefas atribuídas a mim' },
  { label: 'Financeiro',         path: '/financeiro',          icon: DollarSign,      category: 'Administrativo', desc: 'Receitas, despesas e saldo' },
  { label: 'Cotações',           path: '/cotacoes',            icon: ShoppingCart,    category: 'Administrativo', desc: 'Ordens de compra' },
  { label: 'Equipe',             path: '/equipe',              icon: Users,           category: 'Administrativo', desc: 'Gerenciar usuários' },
  { label: 'Comercial',         path: '/comercial',           icon: TrendingUp,      category: 'Comercial', desc: 'Pipeline completo de vendas' },
  { label: 'Orçamentos',         path: '/orcamentos',          icon: FileText,        category: 'Comercial', desc: 'Propostas e orçamentos' },
  { label: 'Contratos',          path: '/contratos',           icon: File,            category: 'Comercial', desc: 'Contratos assinados' },
  { label: 'Empreendimentos',    path: '/empreendimentos',     icon: Building2,       category: 'Produção', desc: 'Projetos e empreendimentos' },
  { label: 'Dashboard Produção', path: '/producao',            icon: BarChart2,       category: 'Produção', desc: 'Visão geral da produção' },
  { label: 'Dashboard Comercial',path: '/comercial/dashboard', icon: BarChart2,       category: 'Comercial', desc: 'Métricas comerciais' },
  { label: 'Suporte',            path: '/suporte',             icon: HelpCircle,      category: 'Suporte', desc: 'Chamados e tickets' },
  { label: 'Configurações',      path: '/configuracoes',       icon: Settings,        category: 'Sistema', desc: 'Configurações do sistema' },
  { label: 'Ajuda',              path: '/ajuda',               icon: HelpCircle,      category: 'Sistema', desc: 'Documentação e tutoriais' },
];

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function filterItems(query) {
  if (!query.trim()) return [];
  const q = normalize(query);
  return NAV_ITEMS.filter(
    (item) =>
      normalize(item.label).includes(q) ||
      normalize(item.desc).includes(q) ||
      normalize(item.category).includes(q)
  ).slice(0, 8);
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const results = filterItems(query);

  // Ctrl+K / Cmd+K foca a busca
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!panelRef.current?.contains(e.target) && e.target !== inputRef.current) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleKeyDown = useCallback((e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      goTo(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }, [open, results, activeIdx]);

  const goTo = useCallback((item) => {
    setQuery('');
    setOpen(false);
    navigate(item.path);
  }, [navigate]);

  const handleChange = (e) => {
    setQuery(e.target.value);
    setActiveIdx(0);
    setOpen(true);
  };

  const handleFocus = () => {
    if (query.trim()) setOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  // Agrupa resultados por categoria
  const grouped = results.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // Índice global para navegação por teclado
  let globalIdx = 0;

  return (
    <div className="relative w-80">
      {/* Input */}
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-erplus-text-light pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder="Pesquisar... (Ctrl+K)"
        className="w-full pl-10 pr-8 py-2 border border-erplus-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20 focus:border-erplus-accent transition bg-white"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-erplus-text-light hover:text-erplus-text transition"
        >
          <X size={14} />
        </button>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div
          ref={panelRef}
          className="absolute top-full mt-2 left-0 w-full bg-white border border-erplus-border rounded-xl shadow-xl z-[80] overflow-hidden"
          style={{ minWidth: '320px' }}
        >
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="px-3 py-1.5 text-[10px] font-bold text-erplus-text-muted uppercase tracking-wider bg-gray-50 border-b border-erplus-border">
                {category}
              </div>
              {items.map((item) => {
                const idx = globalIdx++;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => goTo(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition border-b border-erplus-border/40 last:border-0 ${
                      activeIdx === idx ? 'bg-erplus-accent/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activeIdx === idx ? 'bg-erplus-accent text-white' : 'bg-gray-100 text-erplus-text-muted'
                    }`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-erplus-text truncate">{item.label}</div>
                      <div className="text-xs text-erplus-text-muted truncate">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          <div className="px-3 py-2 bg-gray-50 border-t border-erplus-border flex items-center gap-3 text-[10px] text-erplus-text-muted">
            <span><kbd className="font-mono bg-white border border-gray-200 rounded px-1 py-0.5">↑↓</kbd> navegar</span>
            <span><kbd className="font-mono bg-white border border-gray-200 rounded px-1 py-0.5">Enter</kbd> abrir</span>
            <span><kbd className="font-mono bg-white border border-gray-200 rounded px-1 py-0.5">Esc</kbd> fechar</span>
          </div>
        </div>
      )}

      {/* Estado vazio com sugestão */}
      {open && query.trim() && results.length === 0 && (
        <div
          ref={panelRef}
          className="absolute top-full mt-2 left-0 w-full bg-white border border-erplus-border rounded-xl shadow-xl z-[80] px-4 py-6 text-center"
        >
          <Search size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-erplus-text-muted">Nenhum resultado para <strong>"{query}"</strong></p>
        </div>
      )}
    </div>
  );
}
