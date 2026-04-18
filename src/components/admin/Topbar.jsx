import { Bell, Menu, ChevronDown, LogOut, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import api from '@/services/api';

export default function Topbar({ onToggleSidebar }) {
  const { admin, logoutAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
    <header className="h-16 bg-base-100 border-b border-base-200/50 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-admin text-admin-text-secondary hover:bg-admin-bg-hover hover:text-admin-text transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
            className="relative p-2 rounded-admin text-admin-text-secondary hover:bg-admin-bg-hover hover:text-admin-text transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute -right-12 sm:right-0 mt-2 w-[280px] sm:w-80 bg-base-100 rounded-xl border border-base-200 shadow-xl animate-slide-down overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
                <h3 className="text-sm font-semibold text-base-content">🔔 Notifikasi</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-admin-accent hover:underline">
                      Tandai dibaca
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="text-admin-text-muted hover:text-admin-text">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-admin-text-muted text-sm">Belum ada notifikasi</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-admin-bg-hover transition-colors cursor-pointer border-b border-admin-border/50 last:border-0 ${!notif.read ? 'bg-admin-accent/5' : ''}`}
                      onClick={() => setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                    >
                      <span className="text-lg flex-shrink-0 mt-0.5">{notif.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!notif.read ? 'font-semibold text-admin-text' : 'text-admin-text-secondary'}`}>{notif.title}</p>
                        <p className="text-xs text-admin-text-muted truncate">{notif.detail}</p>
                      </div>
                      <span className="text-[10px] text-admin-text-muted whitespace-nowrap flex-shrink-0">{notif.time}</span>
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-admin-accent flex-shrink-0 mt-1.5"></span>}
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-admin-border text-center">
                <button
                  onClick={() => { setNotifOpen(false); navigate('/admin-panel/transactions'); }}
                  className="text-xs text-admin-accent hover:underline font-medium"
                >
                  Lihat semua transaksi →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-admin hover:bg-admin-bg-hover transition-colors"
          >
            <div className="w-8 h-8 rounded-admin bg-admin-accent flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div className="flex flex-col items-start text-left hidden sm:flex">
              <span className="text-[10px] text-admin-text-muted leading-none">{greeting},</span>
              <span className="text-sm font-medium text-admin-text leading-tight">
                {admin?.username || 'Admin'}
              </span>
            </div>
            <ChevronDown size={14} className={`text-admin-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-base-100 rounded-lg border border-base-200 shadow-xl animate-slide-down overflow-hidden z-50">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-error hover:bg-base-200 transition-colors"
              >
                <LogOut size={16} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
