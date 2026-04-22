import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { adminLogin } from '@/services/authService';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  // ═══ PIN Re-Login State ═══
  const [hasPin, setHasPin] = useState(false);
  const [showPinMode, setShowPinMode] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [cachedAdmin, setCachedAdmin] = useState(null);

  // Check if PIN is set and we have a cached admin (session expired scenario)
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/auth/admin/pin-status');
        setHasPin(data.hasPin);
      } catch {}

      // Check if there's a cached admin username from a previous session (for PIN re-login)
      const pinUser = localStorage.getItem('infaqly_admin_pin_user');
      const adminStr = localStorage.getItem('infaqly_admin');
      if (pinUser) {
        setCachedAdmin({ username: pinUser });
      } else if (adminStr) {
        try {
          const admin = JSON.parse(adminStr);
          setCachedAdmin(admin);
        } catch {}
      }
    })();
  }, []);

  // Set page title for SEO
  useEffect(() => {
    document.title = 'Admin Panel — infaqLy Console';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Panel administrasi infaqLy untuk mengelola kampanye donasi, transaksi, dan pengaturan platform.');
    return () => { document.title = 'infaqLy — Platform Donasi Infaq & Wakaf Digital'; };
  }, []);

  // Auto-show PIN mode if PIN is set AND we have cached admin (session expired)
  const canUsePinLogin = hasPin && cachedAdmin?.username;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Semua field wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const result = await adminLogin({ username: username.trim(), password });
      loginAdmin(result.user, result.token);
      toast.success('Berhasil masuk ke Admin Panel');
      navigate('/admin-panel/dashboard');
    } catch (err) {
      toast.error(err.message || 'Kredensial tidak valid');
    } finally {
      setLoading(false);
    }
  };

  const handlePinLogin = async (e) => {
    e?.preventDefault();
    if (!pinInput || pinInput.length < 4) {
      toast.error('Masukkan PIN (minimal 4 digit)');
      return;
    }
    setLoading(true);
    try {
      const result = await api.post('/auth/admin/pin-login', {
        username: cachedAdmin.username,
        pin: pinInput,
      });
      loginAdmin(result.user, result.token);
      toast.success('Berhasil masuk dengan PIN 🔐');
      navigate('/admin-panel/dashboard');
    } catch (err) {
      toast.error(err.message || 'PIN salah');
      setPinInput('');
    } finally {
      setLoading(false);
    }
  };

  // ═══ PIN Login Mode ═══
  if (showPinMode && canUsePinLogin) {
    return (
      <div className="min-h-screen admin-bg admin-grid-bg flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md animate-scale-in">
          <div className="admin-card p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto mb-4 rounded-admin bg-admin-accent/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] text-admin-accent">verified_user</span>
              </div>
              <h1 className="text-xl font-bold text-admin-text">Selamat Datang Kembali</h1>
              <p className="text-sm text-admin-text-muted mt-1">
                Masuk sebagai <span className="text-admin-accent font-semibold">{cachedAdmin.username}</span>
              </p>
            </div>

            <form onSubmit={handlePinLogin} className="space-y-5">
              <div>
                <label htmlFor="pin-input" className="block text-sm font-medium text-admin-text-secondary mb-1.5">PIN Keamanan</label>
                <input
                  id="pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                  className="input-admin text-center text-2xl tracking-[0.5em] font-mono !py-4"
                  autoFocus
                />
                <p className="text-xs text-admin-text-muted mt-2 text-center">
                  Masukkan PIN 4-8 digit yang sudah Anda atur
                </p>
              </div>
              <button type="submit" disabled={loading || pinInput.length < 4} className="btn-admin-primary w-full py-3.5">
                {loading ? <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Memverifikasi...</> : <><span className="material-symbols-outlined text-[18px]">verified_user</span> Masuk dengan PIN</>}
              </button>
            </form>

            <button
              onClick={() => setShowPinMode(false)}
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-admin-text-muted hover:text-admin-text-secondary transition-colors py-2"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Masuk dengan Password
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ Normal Login Mode ═══
  return (
    <div className="min-h-screen admin-bg admin-grid-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="admin-card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-admin bg-admin-accent/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px] text-admin-accent">lock</span>
            </div>
            <h1 className="text-xl font-bold text-admin-text">Admin Panel</h1>
            <p className="text-sm text-admin-text-muted font-mono">infaqLy Console</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-username" className="block text-sm font-medium text-admin-text-secondary mb-1.5">Username</label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="input-admin"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-admin-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-admin pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted hover:text-admin-text transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-admin-primary w-full py-3.5">
              {loading ? <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Sedang Masuk...</> : <><span className="material-symbols-outlined text-[18px]">lock</span> Sign In</>}
            </button>
          </form>

          {/* PIN Quick Login Button */}
          {canUsePinLogin && (
            <button
              onClick={() => setShowPinMode(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-admin-accent hover:text-admin-accent/80 transition-colors py-2.5 rounded-admin hover:bg-admin-accent/5"
            >
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              Masuk dengan PIN ({cachedAdmin.username})
            </button>
          )}
        </div>

        <div className="text-center mt-6 space-y-3">
          <Link to="/" className="text-sm text-admin-text-muted hover:text-admin-text-secondary transition-colors block">
            ← Kembali ke situs utama
          </Link>
          <div className="admin-card p-3 text-xs text-admin-text-muted">
            <p className="font-semibold text-admin-text-secondary mb-1">🔑 Demo Credentials</p>
            <p>Username: <code className="font-mono text-admin-accent">admin</code></p>
            <p>Password: <code className="font-mono text-admin-accent">admin123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
