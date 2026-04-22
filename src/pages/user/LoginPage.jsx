import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="w-full animate-scale-in">
      <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-2xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-headline text-white">Masuk ke InfaqLy</h1>
          <p className="mt-3 text-sm text-emerald-100/70 font-medium">Selamat datang kembali, mari lanjutkan kebaikan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">
              Username atau No. WhatsApp
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Contoh: ahmad / 081234567890"
              className="w-full bg-slate-950/50 border border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium backdrop-blur-md"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/50 border border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium pr-12 backdrop-blur-md"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Link
              to="/forgot-password"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-bold"
            >
              Lupa Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2 border border-emerald-400/20"
          >
            {loading ? (
              <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Memverifikasi login...</>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center bg-black/20 p-4 rounded-2xl border border-white/5">
          <p className="text-sm text-slate-300 font-medium">
            Belum tergabung bersama kami?{' '}
            <Link to="/register" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors hover:underline">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
