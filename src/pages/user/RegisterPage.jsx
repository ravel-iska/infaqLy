import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { register } from '@/services/authService';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', whatsapp: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (duplicateError) setDuplicateError(''); // Clear error on field change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDuplicateError('');
    const { username, email, whatsapp, password, confirmPassword } = form;
    if (!username || !email || !whatsapp || !password || !confirmPassword) {
      toast.error('Semua field wajib diisi');
      return;
    }
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    if (!/^\d{10,13}$/.test(whatsapp)) {
      toast.error('Nomor WhatsApp tidak valid (10-13 digit)');
      return;
    }

    setLoading(true);
    try {
      const result = await register({ username: username.trim(), email: email.trim(), whatsapp: whatsapp.trim(), password });
      loginUser(result.user, result.token);
      toast.success('Pendaftaran berhasil! Selamat datang 🎉');
      navigate('/explore');
    } catch (err) {
      const msg = err.message || 'Terjadi kesalahan saat mendaftar';
      if (msg.includes('sudah terdaftar') || msg.includes('sudah digunakan')) {
        setDuplicateError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const getStrength = () => {
    const p = form.password;
    if (p.length === 0) return { width: '0%', color: 'bg-gray-200', label: '' };
    if (p.length < 6) return { width: '25%', color: 'bg-danger', label: 'Lemah' };
    if (p.length < 8) return { width: '50%', color: 'bg-warning', label: 'Sedang' };
    if (/(?=.*[A-Z])(?=.*\d)/.test(p)) return { width: '100%', color: 'bg-success', label: 'Kuat' };
    return { width: '75%', color: 'bg-user-accent', label: 'Bagus' };
  };

  const strength = getStrength();

  return (
    <div className="w-full animate-scale-in">
      <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[2rem] ambient-shadow border border-white/40">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-headline text-on-surface">Daftar Akun InfaqLy</h1>
          <p className="mt-3 text-sm text-on-surface-variant font-medium">Bergabung untuk mulai berbagi kebaikan hari ini</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Duplicate Account Alert */}
          {duplicateError && (
            <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 text-sm">
              <p className="text-warning font-semibold mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                Akun Sudah Terdaftar
              </p>
              <p className="text-slate-600 text-xs mb-3">{duplicateError}</p>
              <Link to="/login" className="inline-flex items-center gap-1 text-sm font-bold text-warning hover:underline">
                Masuk ke akun Anda <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Username *</label>
            <input type="text" value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="Contoh: ahmadrahmani" className="w-full bg-surface-container/50 border border-slate-200 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Email *</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Contoh: ahmad@email.com" className="w-full bg-surface-container/50 border border-slate-200 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Nomor WhatsApp *</label>
            <input type="text" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="Contoh: 081234567890" className="w-full bg-surface-container/50 border border-slate-200 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" />
            <p className="mt-2 text-xs text-slate-500 font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">info</span> Digunakan untuk mengirim kuitansi donasi</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Password *</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" className="w-full bg-surface-container/50 border border-slate-200 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {/* Strength meter */}
            {form.password && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }}></div>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-1">Kekuatan Sandi: <span className="font-bold">{strength.label}</span></p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Konfirmasi Password *</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="••••••••" className="w-full bg-surface-container/50 border border-slate-200 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4">
            {loading ? <span className="animate-pulse">Memproses pendaftaran...</span> : <>
              <span>Buat Akun Anda</span>
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </>}
          </button>
        </form>

        <div className="mt-8 text-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <p className="text-sm text-slate-600 font-medium">
            Sudah terdaftar?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Silakan Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
