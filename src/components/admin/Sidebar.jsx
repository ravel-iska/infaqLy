import { NavLink, Link } from 'react-router-dom';
import { ADMIN_NAV_ITEMS } from '@/utils/constants';

const iconMap = {
  LayoutDashboard: 'dashboard',
  Megaphone: 'campaign',
  CreditCard: 'receipt_long',
  Wallet: 'account_balance_wallet',
  Settings: 'settings',
};

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`fixed top-0 left-0 h-screen bg-base-100 border-r border-base-200 flex flex-col transition-all duration-300 z-40 ${collapsed ? '-translate-x-full md:translate-x-0 md:w-[72px]' : 'translate-x-0 w-[240px]'}`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-base-200 bg-base-100">
        <Link to="/admin-panel/dashboard" className="flex items-center gap-3 overflow-hidden ml-1">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
            <span className="material-symbols-outlined text-primary text-[20px]">spa</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in flex flex-col justify-center">
              <span className="text-xl font-extrabold text-base-content font-headline tracking-tight leading-none">InfaqLy</span>
              <span className="block text-[10px] text-primary font-bold tracking-wider uppercase mt-1">Admin Console</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto scrollbar-admin">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] || 'circle';
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-base-200 text-primary border border-base-300 shadow-sm'
                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content border border-transparent'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></div>}
                  <span className={`material-symbols-outlined text-[22px] transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {Icon}
                  </span>
                  {!collapsed && <span className="animate-fade-in">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-4 border-t border-base-200 bg-base-100">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-base-content/60 bg-base-200 hover:bg-base-300 transition-colors text-sm font-semibold border border-base-300 hover:text-base-content"
        >
          <span className="material-symbols-outlined text-[18px]">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
          {!collapsed && <span>Ciutkan Panel</span>}
        </button>
      </div>
    </aside>
  );
}
