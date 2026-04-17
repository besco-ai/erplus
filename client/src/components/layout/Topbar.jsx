import { Search, Bell } from 'lucide-react';
import useAuthStore from '../../hooks/useAuthStore';

export default function Topbar() {
  const { user } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b border-erplus-border flex items-center justify-between px-6 flex-shrink-0">
      {/* Search */}
      <div className="relative w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-erplus-text-light" />
        <input
          type="text"
          placeholder="Pesquisar..."
          className="w-full pl-10 pr-4 py-2 border border-erplus-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-erplus-accent/20 focus:border-erplus-accent transition"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-erplus-border-light transition">
          <Bell size={20} className="text-erplus-text-muted" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-erplus-accent rounded-full" />
        </button>

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
