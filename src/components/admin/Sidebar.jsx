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
    <aside className={`fixed top-0 left-0 h-screen bg-white/90 dark:bg-[#1d232a]/90 backdrop-blur-2xl border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col transition-all duration-300 z-40 shadow-2xl shadow-slate-200/20 dark:shadow-black/20 ${collapsed ? '-translate-x-full md:translate-x-0 md:w-[88px]' : 'translate-x-0 w-[260px]'}`}>
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-slate-100/50 dark:border-slate-800/50 bg-transparent">
        <Link to="/admin-panel/dashboard" className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'w-full justify-center' : 'ml-1'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30 shadow-inner">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[24px]">spa</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in flex flex-col justify-center">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-headline tracking-tight leading-none pt-1">InfaqLy</span>
              <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-widest uppercase mt-1">Admin Console</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto scrollbar-admin">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] || 'circle';
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'
                } ${collapsed ? 'px-0 justify-center' : 'px-4'}`
              }
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-emerald-500 rounded-r-lg"></div>}
                  <span className={`material-symbols-outlined text-[24px] transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110'}`}>
                    {Icon}
                  </span>
                  {!collapsed && <span className="animate-fade-in text-[15px]">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-5 border-t border-slate-100/50 dark:border-slate-800/50 bg-transparent">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-3 px-3 py-3 rounded-2xl text-slate-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50 font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
          {!collapsed && <span>Ciutkan Panel</span>}
        </button>
      </div>
    </aside>
  );
}
