import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile overlay sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-[-44px] p-2 bg-white rounded-lg shadow-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar with hamburger */}
        <header className="h-14 bg-white border-b border-erplus-border flex items-center px-4 md:hidden flex-shrink-0">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-600">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-7 h-7 rounded-lg bg-erplus-accent text-white flex items-center justify-center font-black text-[10px]">E+</div>
            <span className="font-bold text-sm">ERPlus</span>
          </div>
        </header>

        {/* Desktop topbar */}
        <div className="hidden md:block">
          <Topbar />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-erplus-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
