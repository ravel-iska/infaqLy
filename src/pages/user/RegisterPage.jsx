import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
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
    <div className="w-full max-w-md animate-scale-in">
      <div className="user-card p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-user-text">🕌 Daftar Akun infaqLy</h1>
          <p className="mt-2 text-sm text-user-text-secondary">Bergabung untuk mulai berbagi kebaikan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Duplicate Account Alert */}
          {duplicateError && (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 text-sm">
              <p className="text-warning font-semibold mb-1">⚠️ Akun Sudah Terdaftar</p>
              <p className="text-user-text-secondary text-xs mb-3">{duplicateError}</p>
              <Link to="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-user-accent hover:underline">
                Masuk ke akun Anda →
              </Link>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-user-text mb-1.5">Username *</label>
            <input type="text" value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="ahmadrahmani" className="input-user" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-user-text mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="ahmad@email.com" className="input-user" />
          </div>
          <div>
            <label className="block text-sm font-medium text-user-text mb-1.5">Nomor WhatsApp *</label>
            <input type="text" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="081234567890" className="input-user" />
            <p className="mt-1 text-xs text-user-text-muted">Untuk notifikasi donasi</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-user-text mb-1.5">Password *</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" className="input-user pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-user-text-muted hover:text-user-text transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* Strength meter */}
            {form.password && (
              <div className="mt-2">
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }}></div>
                </div>
                <p className="text-xs text-user-text-muted mt-1">Kekuatan: {strength.label}</p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-user-text mb-1.5">Konfirmasi Password *</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="••••••••" className="input-user" />
          </div>

          <button type="submit" disabled={loading} className="btn-user-primary w-full py-3.5 mt-2">
            {loading ? <span className="animate-pulse">Memuat...</span> : <><UserPlus size={18} /> Daftar</>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-user-text-secondary">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-user-accent font-semibold hover:underline">
              Masuk di sini →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
