import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';
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
    <div className="w-full max-w-md animate-scale-in">
      <div className="user-card p-8">
        {/* Step 1: Cari Akun */}
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-user-accent-light flex items-center justify-center">
                <KeyRound size={28} className="text-user-accent" />
              </div>
              <h1 className="text-2xl font-bold text-user-text">Lupa Password?</h1>
              <p className="mt-2 text-sm text-user-text-secondary">
                Masukkan email atau nomor WhatsApp yang terdaftar untuk mereset password
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-user-text mb-1.5">Email atau No. WhatsApp</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ahmad@email.com / 081234567890"
                  className="input-user"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleFindAccount()}
                />
              </div>
              <button onClick={handleFindAccount} disabled={loading} className="btn-user-primary w-full py-3.5">
                {loading ? <span className="animate-pulse">Mencari...</span> : <><Send size={18} /> Kirim Kode OTP</>}
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
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-user-accent-light flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <h1 className="text-2xl font-bold text-user-text">Masukkan Kode OTP</h1>
              <p className="mt-2 text-sm text-user-text-secondary">
                Kode 6 digit telah dikirim ke WhatsApp <strong>{maskPhone(foundUser?.whatsapp)}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-user-text mb-1.5">Kode OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="______"
                  className="input-user text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                />
              </div>
              <button onClick={handleVerifyOtp} className="btn-user-primary w-full py-3.5">
                ✅ Verifikasi
              </button>
              <div className="flex items-center justify-between">
                <button onClick={() => { setStep(1); setOtp(''); }} className="py-2 text-sm text-user-text-muted hover:text-user-accent transition-colors">
                  ← Kembali
                </button>
                <button
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className={`py-2 text-sm transition-colors ${resendCooldown > 0 ? 'text-user-text-muted cursor-not-allowed' : 'text-user-accent hover:underline'}`}
                >
                  {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim ulang OTP'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Password Baru */}
        {step === 3 && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-user-accent-light flex items-center justify-center">
                <span className="text-2xl">🔐</span>
              </div>
              <h1 className="text-2xl font-bold text-user-text">Password Baru</h1>
              <p className="mt-2 text-sm text-user-text-secondary">Buat password baru untuk akun Anda</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-user-text mb-1.5">Password Baru *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="input-user pr-12"
                    autoFocus
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-user-text-muted hover:text-user-text transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPassword && newPassword.length < 6 && (
                  <p className="text-xs text-danger mt-1">Password minimal 6 karakter</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-user-text mb-1.5">Konfirmasi Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="input-user"
                  onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-danger mt-1">Password tidak cocok</p>
                )}
              </div>
              <button onClick={handleResetPassword} disabled={loading} className="btn-user-primary w-full py-3.5">
                {loading ? <span className="animate-pulse">Menyimpan...</span> : '🔐 Reset Password'}
              </button>
            </div>
          </>
        )}

        {/* Step 4: Selesai */}
        {step === 4 && (
          <div className="text-center py-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle size={40} className="text-success" />
            </div>
            <h1 className="text-2xl font-bold text-user-text">Berhasil! 🎉</h1>
            <p className="mt-3 text-sm text-user-text-secondary">
              Password Anda telah berhasil direset. Silakan login dengan password baru.
            </p>
            <button onClick={() => navigate('/login')} className="btn-user-primary mt-6 px-8 py-3">
              Masuk Sekarang
            </button>
          </div>
        )}

        {/* Back to login link */}
        {step < 4 && (
          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-user-text-secondary hover:text-user-accent transition-colors">
              <ArrowLeft size={14} /> Kembali ke halaman login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
