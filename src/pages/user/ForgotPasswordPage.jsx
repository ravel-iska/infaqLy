import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendError, setSendError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 1: Cari akun & kirim OTP via backend
  const handleFindAccount = async () => {
    if (!identifier.trim()) {
      toast.error('Masukkan email atau nomor WhatsApp');
      return;
    }

    setLoading(true);
    setSendError('');
    try {
      const result = await api.post('/users/forgot-password', { identifier: identifier.trim() });
      setFoundUser({ id: result.userId, whatsapp: result.whatsapp });
      toast.success('Kode OTP telah dikirim ke WhatsApp Anda! 📱');
      setStep(2);
      // Start resend cooldown
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const msg = err.message || 'Gagal mengirim OTP';
      if (msg.includes('Fonnte') || msg.includes('WhatsApp') || msg.includes('token')) {
        setSendError(msg);
        toast.error('Gagal mengirim OTP — konfigurasi WhatsApp API belum lengkap');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await api.post('/users/forgot-password', { identifier: identifier.trim() });
      toast.success('OTP baru telah dikirim! 📱');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error(err.message || 'Gagal mengirim ulang OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verifikasi OTP via backend
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast.error('Masukkan kode OTP');
      return;
    }
    setLoading(true);
    try {
      await api.post('/users/verify-otp', { userId: foundUser.id, code: otp.trim() });
      toast.success('Kode OTP terverifikasi! ✅');
      setStep(3);
    } catch (err) {
      toast.error(err.message || 'Kode OTP salah');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set password baru via backend
  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      await api.post('/users/reset-password', { userId: foundUser.id, newPassword });
      toast.success('Password berhasil direset! 🎉');
      setStep(4);
    } catch (err) {
      toast.error(err.message || 'Gagal reset password');
    } finally {
      setLoading(false);
    }
  };

  // Mask nomor WhatsApp: 0812****7890
  const maskPhone = (phone) => {
    if (!phone || phone.length < 8) return phone;
    return phone.slice(0, 4) + '****' + phone.slice(-4);
  };

  return (
    <div className="w-full animate-scale-in">
      <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[2rem] ambient-shadow border border-white/40">
        {/* Step 1: Cari Akun */}
        {step === 1 && (
          <>
            <div className="text-center mb-10">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-primary">lock_reset</span>
              </div>
              <h1 className="text-3xl font-bold font-headline text-on-surface">Lupa Password?</h1>
              <p className="mt-3 text-sm text-on-surface-variant font-medium">
                Masukkan email atau ponsel untuk mereset sandi Anda
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Email atau No. WhatsApp</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: ahmad@email.com / 081234567890"
                  className="w-full bg-surface-container/50 border border-slate-200 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleFindAccount()}
                />
              </div>
              <button onClick={handleFindAccount} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                {loading ? <span className="animate-pulse">Mencari Data...</span> : <>
                  <span>Kirim Kode OTP</span>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </>}
              </button>

              {/* Error: Fonnte not configured */}
              {sendError && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger">
                  <p className="font-semibold mb-1">❌ Gagal Mengirim OTP</p>
                  <p>{sendError}</p>
                  <p className="mt-2 text-user-text-muted">Hubungi admin untuk mengkonfigurasi token Fonnte WhatsApp di panel admin.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 2: Verifikasi OTP */}
        {step === 2 && (
          <>
            <div className="text-center mb-10">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-primary">smartphone</span>
              </div>
              <h1 className="text-3xl font-bold font-headline text-on-surface">Cek WhatsApp</h1>
              <p className="mt-3 text-sm text-on-surface-variant font-medium">
                Kami telah mengirim 6 digit OTP ke <strong className="text-on-surface">{maskPhone(foundUser?.whatsapp)}</strong>
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2 text-center">Masukkan Kode OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="______"
                  className="w-full bg-surface-container/50 border border-slate-200 text-on-surface placeholder:text-slate-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center text-3xl tracking-[0.5em] font-mono font-bold"
                  maxLength={6}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                />
              </div>
              <button onClick={handleVerifyOtp} className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Verifikasi OTP</span>
              </button>
              <div className="flex items-center justify-between mt-2 px-1">
                <button onClick={() => { setStep(1); setOtp(''); }} className="text-sm font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span> Ubah Nomor
                </button>
                <button
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className={`text-sm font-bold transition-colors ${resendCooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-primary hover:underline'}`}
                >
                  {resendCooldown > 0 ? `Kirim ulang dalam (${resendCooldown}s)` : 'Kirim Ulang OTP'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Password Baru */}
        {step === 3 && (
          <>
            <div className="text-center mb-10">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-primary">key</span>
              </div>
              <h1 className="text-3xl font-bold font-headline text-on-surface">Sandi Baru</h1>
              <p className="mt-3 text-sm text-on-surface-variant font-medium">Lindungi akun Anda dengan kata sandi yang kuat</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Password Baru *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-surface-container/50 border border-slate-200 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium pr-12"
                    autoFocus
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {newPassword && newPassword.length < 6 && (
                  <p className="text-xs text-danger font-bold mt-2">Password minimal 6 karakter!</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Konfirmasi Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full bg-surface-container/50 border border-slate-200 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-danger font-bold mt-2">Password tidak cocok dengan yang di atas!</p>
                )}
              </div>
              <button onClick={handleResetPassword} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4">
                {loading ? <span className="animate-pulse">Menyimpan Sandi...</span> : <>
                  <span>Simpan Password</span>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                </>}
              </button>
            </div>
          </>
        )}

        {/* Step 4: Selesai */}
        {step === 4 && (
          <div className="text-center py-6">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[50px] text-emerald-500">check_circle</span>
            </div>
            <h1 className="text-3xl font-bold font-headline text-on-surface">Berhasil Dirubah!</h1>
            <p className="mt-4 text-sm text-slate-500 font-medium">
              Sandi Anda telah berhasil kami perbarui. Silakan masuk menggunakan kredensial baru Anda.
            </p>
            <button onClick={() => navigate('/login')} className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-8">
              Masuk Sekarang <span className="material-symbols-outlined text-[18px]">login</span>
            </button>
          </div>
        )}

        {/* Back to login link */}
        {step < 4 && (
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Kembali ke login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
