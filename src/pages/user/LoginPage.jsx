import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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
      <div className="bg-surface-container-lowest dark:bg-slate-800 p-8 md:p-10 rounded-[2rem] ambient-shadow border border-white/40 dark:border-slate-700">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-headline text-on-surface dark:text-white">Masuk ke InfaqLy</h1>
          <p className="mt-3 text-sm text-on-surface-variant dark:text-slate-400 font-medium">Selamat datang kembali, mari lanjutkan kebaikan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-on-surface dark:text-slate-200 mb-2">
              Username atau No. WhatsApp
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Contoh: ahmad / 081234567890"
              className="w-full bg-surface-container/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-medium"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface dark:text-slate-200 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-medium pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-emerald-400 transition-colors"
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
              className="text-sm text-primary hover:text-primary/70 transition-colors font-bold"
            >
              Lupa Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary dark:bg-emerald-600 hover:bg-primary/90 dark:hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Memverifikasi login...</>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Belum tergabung bersama kami?{' '}
            <Link to="/register" className="text-primary dark:text-emerald-400 font-bold hover:underline">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
