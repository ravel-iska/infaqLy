import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Megaphone, CreditCard, Wallet, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { ADMIN_NAV_ITEMS } from '@/utils/constants';

const iconMap = {
  LayoutDashboard,
  Megaphone,
  CreditCard,
  Wallet,
  Settings,
};

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`fixed top-0 left-0 h-screen bg-admin-bg-sidebar border-r border-admin-border flex flex-col transition-all duration-300 z-40 ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-admin-border">
        <Link to="/admin-panel/dashboard" className="flex items-center gap-2 overflow-hidden">
          <span className="text-2xl flex-shrink-0">🕌</span>
          {!collapsed && (
            <div className="animate-fade-in">
              <span className="text-lg font-bold text-admin-text font-heading">infaqLy</span>
              <span className="block text-[10px] text-admin-text-muted font-mono -mt-1">Console</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-admin">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-admin text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-admin-bg-card text-admin-accent border-l-2 border-admin-accent shadow-glow-indigo'
                    : 'text-admin-text-secondary hover:bg-admin-bg-hover hover:text-admin-text border-l-2 border-transparent'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon size={20} className="flex-shrink-0" />}
              {!collapsed && <span className="animate-fade-in">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-admin-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-admin text-admin-text-secondary hover:bg-admin-bg-hover hover:text-admin-text transition-colors text-sm"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Ciutkan</span>}
        </button>
      </div>
    </aside>
  );
}
