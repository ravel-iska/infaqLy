import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/services/api';

export default function Topbar({ onToggleSidebar }) {
  const { admin, logoutAdmin } = useAuth();
  const { isAdminDark, toggleAdminTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [greeting, setGreeting] = useState('');
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Greeting Sync
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 11) setGreeting('Selamat Pagi');
      else if (hour < 15) setGreeting('Selamat Siang');
      else if (hour < 18) setGreeting('Selamat Sore');
      else setGreeting('Selamat Malam');
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load recent activity as notifications
  useEffect(() => {
    (async () => {
      try {
        const donations = await api.get('/donations?limit=5');
        const items = (donations.donations || donations || []).slice(0, 5).map((d, i) => ({
          id: i,
          icon: '💰',
          title: `Donasi dari ${d.donorName || 'Anonim'}`,
          detail: `Rp ${new Intl.NumberFormat('id-ID').format(d.amount || 0)}`,
          time: d.createdAt ? new Date(d.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '',
          read: true,
        }));
        const systemNotifs = [
          { id: 'sys1', icon: '🔔', title: 'Server berjalan normal', detail: 'Backend & Frontend aktif', time: 'Baru saja', read: false },
          { id: 'sys2', icon: '⚙️', title: 'Pengaturan tersimpan', detail: 'API keys berhasil diupdate', time: 'Hari ini', read: false },
        ];
        setNotifications([...systemNotifs, ...items]);
      } catch {
        setNotifications([
          { id: 'sys1', icon: '🔔', title: 'Server berjalan normal', detail: 'Backend & Frontend aktif', time: 'Baru saja', read: false },
          { id: 'sys2', icon: '📋', title: 'Belum ada donasi', detail: 'Menunggu transaksi pertama', time: '-', read: true },
        ]);
      }
    })();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin-panel/login');
  };

  return (
    <header className="h-20 bg-white/80 dark:bg-[#1d232a]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-30 shadow-sm shadow-slate-200/20 dark:shadow-none transition-all duration-300">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all md:hidden"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        {/* Placeholder for page title if needed */}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Theme Toggle */}
        <button
          onClick={toggleAdminTheme}
          className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all"
          aria-label="Toggle Theme"
        >
          {isAdminDark ? <span className="material-symbols-outlined text-[22px]">light_mode</span> : <span className="material-symbols-outlined text-[22px]">dark_mode</span>}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
            className="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-rose-500/50 ring-2 ring-white dark:ring-[#1d232a] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute -right-12 sm:right-0 mt-3 w-[320px] sm:w-[380px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-black/50 animate-slide-down overflow-hidden z-50 origin-top-right">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-500">notifications_active</span> Notifikasi
                </h3>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                      Tandai dibaca
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-slate-800 rounded-full p-1">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-admin">
                {notifications.length === 0 ? (
                  <div className="px-5 py-10 text-center text-slate-400 dark:text-slate-500 text-sm font-medium flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[32px] opacity-50">notifications_paused</span>
                    Belum ada notifikasi
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/50 last:border-0 ${!notif.read ? 'bg-emerald-500/5' : ''}`}
                      onClick={() => setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                    >
                      <span className="text-xl flex-shrink-0 mt-0.5">{notif.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!notif.read ? 'font-bold text-slate-800 dark:text-slate-200' : 'font-medium text-slate-600 dark:text-slate-400'}`}>{notif.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 truncate mt-0.5">{notif.detail}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{notif.time}</span>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-800/30">
                <button
                  onClick={() => { setNotifOpen(false); navigate('/admin-panel/transactions'); }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                >
                  Lihat semua transaksi <span className="inline-block translate-y-px ml-0.5">→</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

        {/* Admin Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
            className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent dark:hover:border-slate-700/50 transition-all font-body"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-500/20 shadow-inner">
              <span className="text-white text-sm font-bold">{admin?.username?.[0]?.toUpperCase() || 'A'}</span>
            </div>
            <div className="flex flex-col items-start text-left hidden sm:flex">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium">{greeting},</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {admin?.username || 'Admin'}
              </span>
            </div>
            <span className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-black/50 animate-slide-down overflow-hidden z-50 origin-top-right">
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Keluar dari Panel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
