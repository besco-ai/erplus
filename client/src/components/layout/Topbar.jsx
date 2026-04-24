import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import useAuthStore from '../../hooks/useAuthStore';
import useNotificationStore from '../../hooks/useNotificationStore';
import NotificationPanel from '../ui/NotificationPanel';
import GlobalSearch from '../ui/GlobalSearch';

export default function Topbar() {
  const { user } = useAuthStore();
  const { unreadCount, panelOpen, openPanel, closePanel, fetchUnreadCount } = useNotificationStore();

  // Busca o contador ao montar e a cada 30s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <header className="h-16 bg-white border-b border-erplus-border flex items-center justify-between px-6 flex-shrink-0">
      {/* Search */}
      <GlobalSearch />

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Sino com painel */}
        <div className="relative">
          <button
            onClick={panelOpen ? closePanel : openPanel}
            className={`relative p-2 rounded-lg transition ${panelOpen ? 'bg-erplus-border-light text-erplus-accent' : 'hover:bg-erplus-border-light text-erplus-text-muted'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-erplus-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationPanel />
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-erplus-accent text-white flex items-center justify-center text-sm font-bold">
              {user.initials}
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-semibold text-erplus-text">{user.name}</div>
              <div className="text-xs text-erplus-text-muted">EG Projetos & Consultorias</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
