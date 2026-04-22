import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { USER_NAV_ITEMS } from '@/utils/constants';

export default function Navbar() {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const { isUserDark, toggleUserTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [greeting, setGreeting] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 11) setGreeting('Selamat Pagi');
      else if (hour < 15) setGreeting('Selamat Siang');
      else if (hour < 18) setGreeting('Selamat Sore');
      else setGreeting('Selamat Malam');
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // 1-minute sync
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ease-out ${scrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-lg shadow-slate-200/20 dark:shadow-none border-b border-white/20 dark:border-slate-800/50 py-2' : 'bg-transparent dark:bg-transparent backdrop-blur-0 py-4'}`}>
      <div className="flex justify-between items-center px-4 md:px-8 max-w-7xl mx-auto w-full transition-all duration-500">
        <div className="flex-1 flex items-baseline">
          {/* Logo */}
          <Link to="/" className="text-2xl font-headline font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-emerald-500">volunteer_activism</span>
            <span>Infaqly</span>
          </Link>
        </div>
          
        {/* Desktop Nav */}
        <div className="hidden md:flex flex-[2] justify-center items-center gap-8 font-body text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-300">
        {USER_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive 
                ? "relative text-emerald-600 dark:text-emerald-400 after:absolute after:bottom-[-8px] after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-emerald-500 after:rounded-full transition-colors" 
                : "relative hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
            }
          >
            {item.label}
          </NavLink>
        ))}
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex flex-1 justify-end items-center gap-4 font-body text-sm tracking-tight">
          
          {/* Theme Toggle Button */}
          <button onClick={toggleUserTheme} aria-label="Ganti tema gelap/terang" className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 transition-colors">
            <span className="material-symbols-outlined text-[20px]">{isUserDark ? 'light_mode' : 'dark_mode'}</span>
          </button>
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent dark:hover:border-slate-700/50 transition-all"
              >
                {(user?.avatarUrl || user?.avatar) ? (
                  <img src={user.avatarUrl || user.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center ring-2 ring-emerald-500/20 shadow-inner">
                    <span className="text-white text-sm font-bold">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex flex-col items-start text-left hidden lg:flex">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium">{greeting},</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{user?.username}</span>
                </div>
                <span className={`material-symbols-outlined text-[16px] text-slate-400 dark:text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-700/50 animate-slide-down origin-top-right overflow-hidden">
                  <div className="p-2">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      Profil Saya
                    </Link>
                    <div className="h-px bg-slate-100 dark:bg-slate-800/50 my-1 mx-2"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold px-4 py-2 transition-colors">
                Masuk
              </Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 border border-emerald-400/20">
                Daftar
              </Link>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={toggleUserTheme} aria-label="Ganti tema gelap/terang" className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined">{isUserDark ? 'light_mode' : 'dark_mode'}</span>
          </button>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Buka/tutup menu navigasi"
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {mobileOpen ? <span className="material-symbols-outlined">close</span> : <span className="material-symbols-outlined">menu</span>}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 animate-slide-down shadow-2xl absolute w-full left-0">
          <div className="px-4 py-4 space-y-1">
            {USER_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                    isActive ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <hr className="my-4 border-slate-100 dark:border-slate-800/50" />
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-[20px]">person</span> Profil Saya
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="block w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span> Keluar
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 px-2 py-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full text-center py-3 text-base font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Masuk
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="w-full text-center py-3 text-base bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-colors">
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
