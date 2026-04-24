import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, CheckCheck, Bell } from 'lucide-react';
import useNotificationStore from '../../hooks/useNotificationStore';

// Mapeamento de tipo/entidade → rota
const ROUTE_MAP = {
  // por relatedEntityType
  entity: {
    Task:       '/tarefas',
    Deal:       '/comercial',
    Schedule:   '/agenda',
    Project:    '/empreendimentos',
    Document:   '/atas',
    Finance:    '/financeiro',
    Production: '/producao',
    Contact:    '/contatos',
    Quote:      '/orcamentos',
    Contract:   '/contratos',
  },
  // por type (fallback se não tiver relatedEntityType)
  type: {
    task_assigned: '/tarefas',
    task_overdue:  '/tarefas',
    deal_updated:  '/comercial',
    document:      '/atas',
    schedule:      '/agenda',
    system:        '/',
  },
};

function getRoute(notification) {
  if (notification.relatedEntityType) {
    return ROUTE_MAP.entity[notification.relatedEntityType] ?? '/';
  }
  return ROUTE_MAP.type[notification.type] ?? '/';
}

const TYPE_STYLES = {
  task_assigned:   { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Tarefa' },
  task_overdue:    { bg: 'bg-red-100',     text: 'text-red-700',    label: 'Atrasada' },
  deal_updated:    { bg: 'bg-purple-100',  text: 'text-purple-700', label: 'Negócio' },
  document:        { bg: 'bg-yellow-100',  text: 'text-yellow-700', label: 'Documento' },
  schedule:        { bg: 'bg-green-100',   text: 'text-green-700',  label: 'Agenda' },
  system:          { bg: 'bg-gray-100',    text: 'text-gray-700',   label: 'Sistema' },
};

function typeStyle(type) {
  return TYPE_STYLES[type] ?? TYPE_STYLES.system;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

export default function NotificationPanel() {
  const {
    notifications,
    loading,
    panelOpen,
    closePanel,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    unreadCount,
  } = useNotificationStore();

  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Fechar ao clicar fora
  useEffect(() => {
    if (!panelOpen) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        closePanel();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [panelOpen, closePanel]);

  if (!panelOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-96 bg-white border border-erplus-border rounded-xl shadow-xl z-50 flex flex-col overflow-hidden"
      style={{ maxHeight: '520px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-erplus-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-erplus-accent" />
          <span className="font-semibold text-sm text-erplus-text">Notificações</span>
          {unreadCount > 0 && (
            <span className="bg-erplus-accent text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              title="Marcar todas como lidas"
              className="p-1.5 rounded-lg hover:bg-erplus-border-light text-erplus-text-muted hover:text-erplus-accent transition"
            >
              <CheckCheck size={15} />
            </button>
          )}
          <button
            onClick={closePanel}
            className="p-1.5 rounded-lg hover:bg-erplus-border-light text-erplus-text-muted transition"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-y-auto flex-1">
        {loading && (
          <div className="flex items-center justify-center py-10 text-erplus-text-muted text-sm">
            Carregando...
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-erplus-text-muted">
            <Bell size={32} className="mb-3 opacity-30" />
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        )}

        {!loading && notifications.map((n) => {
          const style = typeStyle(n.type);
          return (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 border-b border-erplus-border last:border-0 hover:bg-gray-50 transition cursor-pointer ${!n.isRead ? 'bg-blue-50/40' : ''}`}
              onClick={() => {
                if (!n.isRead) markAsRead(n.id);
                closePanel();
                navigate(getRoute(n));
              }}
            >
              {/* Indicador não lido */}
              <div className="mt-1.5 flex-shrink-0">
                {!n.isRead
                  ? <span className="block w-2 h-2 rounded-full bg-erplus-accent" />
                  : <span className="block w-2 h-2 rounded-full bg-transparent" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                  <span className="text-xs text-erplus-text-muted ml-auto">{timeAgo(n.createdAt)}</span>
                </div>
                <p className={`text-sm font-medium truncate ${n.isRead ? 'text-erplus-text-muted' : 'text-erplus-text'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-erplus-text-muted mt-0.5 line-clamp-2">{n.message}</p>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                className="flex-shrink-0 p-1 rounded hover:bg-red-50 text-erplus-text-muted hover:text-red-500 transition mt-0.5"
                title="Remover"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
