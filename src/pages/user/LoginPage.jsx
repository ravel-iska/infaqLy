import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { login } from '@/services/authService';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast.error('Semua field wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const result = await login({ identifier: identifier.trim(), password });
      loginUser(result.user, result.token);
      toast.success('Berhasil masuk! 🎉');
      navigate('/explore');
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="user-card p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-user-text">🕌 Masuk ke infaqLy</h1>
          <p className="mt-2 text-sm text-user-text-secondary">Selamat datang kembali</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-user-text mb-1.5">
              Username atau No. WhatsApp
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ahmad / 081234567890"
              className="input-user"
              autoFocus
            />
            <p className="mt-1 text-xs text-user-text-muted">
              Masukkan username atau nomor WhatsApp yang terdaftar
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-user-text mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-user pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-user-text-muted hover:text-user-text transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-user-accent hover:underline font-medium"
            >
              Lupa Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-user-primary w-full py-3.5"
          >
            {loading ? (
              <span className="animate-pulse">Memuat...</span>
            ) : (
              <>
                <LogIn size={18} /> Masuk
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-user-border"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-user-text-muted">atau</span></div>
          </div>
          <p className="text-sm text-user-text-secondary">
            Belum punya akun?{' '}
            <Link to="/register" className="text-user-accent font-semibold hover:underline">
              Daftar di sini →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
