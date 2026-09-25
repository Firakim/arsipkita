import { useState, type ReactNode } from 'react';
import { Archive, LogOut, Menu, X, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../AppContext';

interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
}

interface AppShellProps {
  navItems: NavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AppShell({
  navItems,
  activeKey,
  onNavigate,
  children,
  title,
  subtitle,
}: AppShellProps) {
  const { currentUser, logout, setViewMode } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isGuru = currentUser?.role === 'guru';

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-ink-100 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-ink-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-ink-900 leading-tight">ArsipKita</p>
              <p className="text-[11px] text-ink-400 leading-tight">
                {isGuru ? 'Panel Guru' : 'Panel Siswa'}
              </p>
            </div>
          </div>
          <button
            className="lg:hidden text-ink-400 hover:text-ink-700"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const active = item.key === activeKey;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                }`}
              >
                <span className={active ? 'text-brand-600' : 'text-ink-400'}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Guru view toggle */}
        {isGuru && (
          <div className="p-3 border-t border-ink-100">
            <div className="rounded-xl bg-ink-50 p-3">
              <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide mb-2">
                Mode Tampilan
              </p>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-white ring-1 ring-ink-100">
                <button
                  onClick={() => setViewMode('guru')}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
                    currentUser?.viewMode === 'guru'
                      ? 'bg-brand-600 text-white'
                      : 'text-ink-500 hover:text-ink-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Guru
                </button>
                <button
                  onClick={() => setViewMode('siswa')}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
                    currentUser?.viewMode === 'siswa'
                      ? 'bg-brand-600 text-white'
                      : 'text-ink-500 hover:text-ink-700'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" /> Siswa
                </button>
              </div>
              <p className="text-[11px] text-ink-400 mt-2 leading-snug">
                Berpindah tampilan antara panel Guru dan Siswa.
              </p>
            </div>
          </div>
        )}

        {/* User */}
        <div className="p-3 border-t border-ink-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
              {currentUser?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-900 truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-ink-400 capitalize">{currentUser?.role}</p>
            </div>
            <button
              onClick={logout}
              className="text-ink-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-ink-900/30 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-ink-100 h-16 flex items-center px-4 sm:px-6 gap-3">
          <button
            className="lg:hidden text-ink-500 hover:text-ink-900"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-ink-900 truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-ink-400 truncate">{subtitle}</p>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div key={activeKey} className="view-enter max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
