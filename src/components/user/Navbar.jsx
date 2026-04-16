import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { USER_NAV_ITEMS } from '@/utils/constants';

export default function Navbar() {
  const { user, isAuthenticated, logoutUser } = useAuth();
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
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
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
    <nav className={`fixed top-0 w-full z-50 transition-colors duration-300 ease-in-out ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm shadow-emerald-900/5' : 'bg-white/80 backdrop-blur-md shadow-sm shadow-emerald-900/5'}`}>
      <div className="flex justify-between items-center px-4 md:px-8 py-3 md:py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/" className="text-2xl font-headline font-bold text-emerald-800">
          Infaqly
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 font-body text-sm tracking-tight text-slate-600">
          {USER_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive 
                  ? "text-emerald-700 font-semibold border-b-2 border-emerald-600 pb-1" 
                  : "hover:text-emerald-600 transition-colors"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-4 font-body text-sm tracking-tight">
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container transition-colors"
              >
                {(user?.avatarUrl || user?.avatar) ? (
                  <img src={user.avatarUrl || user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex flex-col items-start text-left hidden sm:flex">
                  <span className="text-[10px] text-slate-500 leading-none">{greeting},</span>
                  <span className="text-sm font-medium text-slate-800 leading-tight">{user?.username}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-user-lg border border-slate-100 animate-slide-down overflow-hidden">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User size={16} />
                    Profil Saya
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-danger hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-slate-600 hover:text-emerald-600 font-medium px-4 py-2">
                Masuk
              </Link>
              <Link to="/register" className="bg-primary hover:bg-primary/90 text-on-primary font-semibold px-6 py-2.5 rounded-xl transition-all duration-300">
                Daftar
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 animate-slide-down shadow-xl absolute w-full left-0">
          <div className="px-4 py-3 space-y-1">
            {USER_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <hr className="my-2 border-slate-100" />
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                >
                  <User size={16} /> Profil Saya
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={16} /> Keluar
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-3 py-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  Masuk
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors">
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
