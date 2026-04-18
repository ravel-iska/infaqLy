import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { register } from '@/services/authService';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', whatsapp: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  
  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  const { loginUser, user, updateUser } = useAuth();
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
      toast.success('Pendaftaran tahap 1 berhasil! Cek WhatsApp Anda.');
      setShowOtpModal(true); // Open OTP verification modal
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

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Masukkan 6 digit kode OTP');
      return;
    }

    setVerifying(true);
    try {
      await api.post('/auth/verify-registration', { code: otp });
      if (user) {
        updateUser({ isVerified: true });
      } else {
        // If user object isn't immediately available, we can rely on session restore later or update local storage manually, but `user` should be set by `loginUser`.
        const cachedUser = JSON.parse(localStorage.getItem('infaqly_user') || '{}');
        if (cachedUser) {
          cachedUser.isVerified = true;
          localStorage.setItem('infaqly_user', JSON.stringify(cachedUser));
        }
      }
      toast.success('Pendaftaran Selesai! Selamat datang 🎉', { duration: 5000 });
      navigate('/explore');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Kode OTP salah atau kedaluwarsa');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post('/auth/resend-registration-otp');
      toast.success('Kode OTP baru telah dikirim ke WhatsApp Anda');
    } catch (err) {
      toast.error('Gagal mengirim ulang OTP');
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
      {/* OTP Modal overlay */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md animate-slide-up border border-outline-variant/20 dark:border-slate-700 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary dark:from-emerald-500 to-secondary-container dark:to-emerald-800"></div>
            <div className="w-16 h-16 bg-primary/10 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-primary dark:text-emerald-400">mark_email_read</span>
            </div>
            <h2 className="text-2xl font-bold font-headline text-on-surface dark:text-white mb-2">Verifikasi WhatsApp</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Kami telah mengirimkan 6 digit kode OTP ke nomor WhatsApp <br/>
              <span className="font-bold text-slate-800 dark:text-slate-200">{form.whatsapp}</span>
            </p>
            
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[1em] text-2xl font-bold bg-surface-container/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400/50 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                autoFocus
              />
              <button
                type="submit"
                disabled={verifying || otp.length !== 6}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {verifying ? <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">verified</span>}
                {verifying ? 'Memverifikasi...' : 'Konfirmasi OTP'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Belum menerima kode?</p>
              <button onClick={handleResendOtp} className="text-sm font-bold text-primary dark:text-emerald-400 hover:underline">
                Kirim Ulang OTP
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface-container-lowest dark:bg-slate-800 p-8 md:p-10 rounded-[2rem] ambient-shadow border border-white/40 dark:border-slate-700">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-headline text-on-surface dark:text-white">Daftar Akun InfaqLy</h1>
          <p className="mt-3 text-sm text-on-surface-variant dark:text-slate-400 font-medium">Bergabung untuk mulai berbagi kebaikan hari ini</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Duplicate Account Alert */}
          {duplicateError && (
            <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 text-sm">
              <p className="text-warning font-semibold mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                Akun Sudah Terdaftar
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs mb-3">{duplicateError}</p>
              <Link to="/login" className="inline-flex items-center gap-1 text-sm font-bold text-warning hover:underline">
                Masuk ke akun Anda <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-on-surface dark:text-slate-200 mb-2">Username *</label>
            <input type="text" value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="Contoh: ahmadrahmani" className="w-full bg-surface-container/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-medium" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface dark:text-slate-200 mb-2">Email *</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Contoh: ahmad@email.com" className="w-full bg-surface-container/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface dark:text-slate-200 mb-2">Nomor WhatsApp *</label>
            <input type="text" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="Contoh: 081234567890" className="w-full bg-surface-container/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-medium" />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">info</span> Digunakan untuk menerima OTP & kuitansi donasi</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface dark:text-slate-200 mb-2">Password *</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" className="w-full bg-surface-container/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-medium pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-emerald-400 transition-colors">
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {/* Strength meter */}
            {form.password && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div className={`h-full rounded-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 flex items-center gap-1">Kekuatan Sandi: <span className="font-bold text-on-surface dark:text-slate-200">{strength.label}</span></p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface dark:text-slate-200 mb-2">Konfirmasi Password *</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="••••••••" className="w-full bg-surface-container/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-medium" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary dark:bg-emerald-600 hover:bg-primary/90 dark:hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4">
            {loading ? <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Memproses pendaftaran...</> : <>
              <span>Buat Akun Anda</span>
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </>}
          </button>
        </form>

        <div className="mt-8 text-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Sudah terdaftar?{' '}
            <Link to="/login" className="text-primary dark:text-emerald-400 font-bold hover:underline">
              Silakan Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
