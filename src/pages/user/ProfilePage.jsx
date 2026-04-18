import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import { generateCertificate } from '@/utils/generateCertificate';
import { updateProfile, changePassword, uploadAvatar, deleteAvatar } from '@/services/authService';
import { openSnapPopup, loadSnapScript } from '@/services/midtrans';
import api from '@/services/api';
import toast from 'react-hot-toast';

/** Render avatar: gambar jika ada, atau huruf pertama username */
function Avatar({ user, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'sm' ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-xl';
  const src = user?.avatarUrl || user?.avatar;
  if (src) {
    return <img src={src} alt="Avatar" className={`${sizeClass} rounded-full object-cover`} />;
  }
  return (
    <div className={`${sizeClass} rounded-full bg-user-accent flex items-center justify-center flex-shrink-0`}>
      <span className="font-bold text-white">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
    </div>
  );
}

/** Status filter tabs */
const FILTER_TABS = [
  { key: 'all', label: 'Semua', icon: 'list' },
  { key: 'success', label: 'Berhasil', icon: 'check_circle' },
  { key: 'pending', label: 'Menunggu', icon: 'schedule' },
  { key: 'failed', label: 'Gagal', icon: 'cancel' },
];

/** Single donation card */
function DonationCard({ tx, user, onPaymentSuccess }) {
  const [downloading, setDownloading] = useState(false);
  const [paying, setPaying] = useState(false);

  const statusConfig = {
    success: {
      label: 'Berhasil',
      icon: 'check_circle',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    pending: {
      label: 'Menunggu',
      icon: 'schedule',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    failed: {
      label: 'Gagal',
      icon: 'cancel',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
    },
    expired: {
      label: 'Kedaluwarsa',
      icon: 'timer_off',
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const status = statusConfig[tx.paymentStatus] || statusConfig.failed;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      generateCertificate({
        donorName: user?.username || 'Donatur',
        program: tx.donorName || 'Program',
        amount: tx.amount,
        date: tx.createdAt,
        transactionId: tx.orderId,
      });
      toast.success('Sertifikat berhasil dibuka!');
    } finally {
      setTimeout(() => setDownloading(false), 1200);
    }
  };

  /** Resume pending payment using stored Snap token */
  const handleResumePay = async () => {
    if (!tx.snapToken) {
      toast.error('Token pembayaran sudah kedaluwarsa. Silakan buat donasi baru.');
      return;
    }
    setPaying(true);
    try {
      await loadSnapScript();
      await openSnapPopup(tx.snapToken, {
        onSuccess: () => {
          toast.success('Pembayaran berhasil! Jazakallahu khairan 🤲', { duration: 5000 });
        },
        onPending: () => {
          toast.success('Pembayaran dalam proses. Menunggu konfirmasi bank.', { duration: 5000 });
        },
        onClose: () => {
          toast('Pembayaran belum diselesaikan', { icon: 'ℹ️' });
        },
      });

      // Poll Midtrans for real status and update DB
      if (tx.orderId) {
        try {
          // No-cache
          await api.get(`/midtrans/check-status/${tx.orderId}?t=${Date.now()}`);
        } catch {}
      }
      // Always reload donations list
      onPaymentSuccess?.();
    } catch {
      toast.error('Gagal membuka halaman pembayaran. Token mungkin sudah expired.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary/20 dark:hover:border-emerald-500/50 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-emerald-900/10">
      {/* Top row: Date + Status badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
          {formatDateShort(tx.createdAt)}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full ${status.bg} ${status.text} border ${status.border} dark:bg-opacity-10 dark:border-opacity-20`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
          {status.label}
        </span>
      </div>

      {/* Program name */}
      <h3 className="text-base font-bold text-on-surface dark:text-slate-200 leading-snug mb-1 line-clamp-1">
        {tx.donorName || 'Program Donasi'}
      </h3>

      {/* Amount */}
      <p className="text-lg font-extrabold text-primary dark:text-emerald-400 font-headline">
        {formatCurrency(tx.amount)}
      </p>

      {/* Divider */}
      <div className="h-px bg-slate-100 dark:bg-slate-700 my-4"></div>

      {/* Bottom row: Order ID + Action */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono text-slate-300 dark:text-slate-500 truncate max-w-[120px]">
          #{tx.orderId || tx.id}
        </span>

        {tx.paymentStatus === 'success' ? (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary/8 text-primary hover:bg-primary hover:text-white transition-all duration-300 disabled:opacity-50 group/btn"
          >
            {downloading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Membuka...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px] group-hover/btn:animate-bounce">download</span>
                Sertifikat
              </>
            )}
          </button>
        ) : tx.paymentStatus === 'pending' ? (
          <button
            onClick={handleResumePay}
            disabled={paying}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white border border-amber-200 hover:border-amber-500 transition-all duration-300 disabled:opacity-50"
          >
            {paying ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Memuat...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">payment</span>
                Bayar Sekarang
              </>
            )}
          </button>
        ) : (
          <span className="text-[11px] font-medium text-slate-300">
            Transaksi {tx.paymentStatus === 'expired' ? 'kedaluwarsa' : 'gagal'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [donationHistory, setDonationHistory] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Load user's donation history from database
  const loadDonations = async () => {
    try {
      const data = await api.get('/donations/me');
      setDonationHistory(data.donations || []);
    } catch {}
  };

  useEffect(() => { loadDonations(); }, []);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Masukkan 6 digit kode OTP');
      return;
    }
    setVerifying(true);
    try {
      await api.post('/auth/verify-registration', { code: otp });
      updateUser({ isVerified: true });
      toast.success('Pendaftaran Selesai! Selamat datang 🎉');
      setShowOtpModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Kode OTP salah atau kedaluwarsa');
    } finally {
      setVerifying(false);
    }
  };

  const successDonations = donationHistory.filter(d => d.paymentStatus === 'success');
  const totalDonated = successDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const uniquePrograms = new Set(successDonations.map(d => d.campaignId)).size;

  // Filter donations based on active tab
  const filteredDonations = activeFilter === 'all'
    ? donationHistory
    : donationHistory.filter(d => {
        if (activeFilter === 'failed') return d.paymentStatus !== 'success' && d.paymentStatus !== 'pending';
        return d.paymentStatus === activeFilter;
      });

  // Count per status for tab badges
  const statusCounts = {
    all: donationHistory.length,
    success: donationHistory.filter(d => d.paymentStatus === 'success').length,
    pending: donationHistory.filter(d => d.paymentStatus === 'pending').length,
    failed: donationHistory.filter(d => d.paymentStatus !== 'success' && d.paymentStatus !== 'pending').length,
  };

  return (
    <div className="animate-fade-in pt-32 pb-12">
      {/* OTP Modal overlay for unverified profiles */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md animate-slide-up border border-outline-variant/20 dark:border-slate-700 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary dark:from-emerald-500 to-secondary-container dark:to-emerald-800"></div>
            <button onClick={() => setShowOtpModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 transition-colors z-10">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <div className="w-16 h-16 bg-primary/10 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-primary dark:text-emerald-400">mark_email_read</span>
            </div>
            <h2 className="text-2xl font-bold font-headline text-on-surface dark:text-white mb-2">Verifikasi WhatsApp</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Kami telah mengirimkan 6 digit kode OTP ke nomor WhatsApp <br/>
              <span className="font-bold text-slate-800 dark:text-slate-200">{user?.whatsapp}</span>
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
                {verifying ? <Loader2 size={18} className="animate-spin" /> : <span className="material-symbols-outlined text-[18px]">verified</span>}
                {verifying ? 'Memverifikasi...' : 'Konfirmasi OTP'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Belum menerima kode?</p>
              <button 
                onClick={async () => {
                  try {
                    await api.post('/auth/resend-registration-otp');
                    toast.success('Kode OTP baru telah dikirim ke WhatsApp Anda');
                  } catch (err) {
                    toast.error('Gagal mengirim ulang OTP');
                  }
                }} 
                className="text-sm font-bold text-primary dark:text-emerald-400 hover:underline"
              >
                Kirim Ulang OTP
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Card */}
        <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-outline-variant/20 dark:border-slate-700 shadow-ambient flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary dark:from-emerald-500 to-secondary-container dark:to-emerald-800"></div>
          <Avatar user={user} size="lg" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-on-surface dark:text-white font-headline flex items-center justify-center sm:justify-start gap-2">
              {user?.username || 'User Explorer'}
              {user?.isVerified && (
                <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 dark:bg-emerald-900/40 rounded-full w-6 h-6 flex items-center justify-center text-[16px] shadow-sm" title="Akun Terverifikasi">verified</span>
              )}
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-3 text-sm text-on-surface-variant dark:text-slate-400 font-medium">
              <span className="flex items-center justify-center sm:justify-start gap-1.5"><span className="material-symbols-outlined text-[16px]">mail</span> {user?.email || 'email@example.com'} {user?.isVerified && <span className="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>}</span>
              <span className="flex items-center justify-center sm:justify-start gap-1.5"><span className="material-symbols-outlined text-[16px]">phone</span> {user?.whatsapp || 'Belum diisi'} {user?.isVerified && <span className="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>}</span>
            </div>
            {!user?.isVerified && (
              <div className="mt-4 flex justify-center sm:justify-start">
                <button 
                  onClick={async () => {
                    try {
                      await api.post('/auth/resend-registration-otp');
                      toast.success('Kode OTP baru telah dikirim ke WhatsApp Anda!');
                      setShowOtpModal(true);
                    } catch (err) {
                      toast.error('Gagal mengirim OTP ke Whatsapp');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">warning</span> Belum Terverifikasi - Verifikasi Sekarang
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary/10 dark:bg-emerald-900/30 text-primary dark:text-emerald-400 hover:bg-primary dark:hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span> Edit Profil
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-[1.5rem] border border-outline-variant/10 dark:border-slate-700 text-center shadow-sm relative overflow-hidden group hover:border-primary/30 dark:hover:border-emerald-500/30 transition-colors">
            <span className="material-symbols-outlined text-3xl text-primary/20 dark:text-emerald-500/10 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform">account_balance_wallet</span>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 font-medium">Total Donasi Saya</p>
            <p className="text-2xl font-bold text-primary dark:text-emerald-400 mt-2 font-headline">{formatCurrency(totalDonated)}</p>
          </div>
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-[1.5rem] border border-outline-variant/10 dark:border-slate-700 text-center shadow-sm relative overflow-hidden group hover:border-primary/30 dark:hover:border-emerald-500/30 transition-colors">
            <span className="material-symbols-outlined text-3xl text-primary/20 dark:text-emerald-500/10 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform">receipt_long</span>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 font-medium">Total Transaksi</p>
            <p className="text-2xl font-bold text-on-surface dark:text-slate-200 mt-2 font-headline">{donationHistory.length} Kali</p>
          </div>
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-[1.5rem] border border-outline-variant/10 dark:border-slate-700 text-center shadow-sm relative overflow-hidden group hover:border-primary/30 dark:hover:border-emerald-500/30 transition-colors">
            <span className="material-symbols-outlined text-3xl text-primary/20 dark:text-emerald-500/10 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform">volunteer_activism</span>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 font-medium">Program Dibantu</p>
            <p className="text-2xl font-bold text-on-surface dark:text-slate-200 mt-2 font-headline">{uniquePrograms} Program</p>
          </div>
        </div>

        {/* ── Donation History — Card Layout ── */}
        <div className="mt-10">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-2">
            <h2 className="text-2xl font-extrabold text-on-surface dark:text-white font-headline tracking-tight">Riwayat Donasi</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Sertifikat tersedia untuk transaksi berhasil
            </div>
          </div>

          {/* Filter Tabs — grid 2x2 on mobile, inline on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeFilter === tab.key
                    ? 'bg-primary dark:bg-emerald-600 text-white shadow-md shadow-primary/20 dark:shadow-emerald-900/20'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:border-primary/20 dark:hover:border-emerald-500/20 hover:text-primary dark:hover:text-emerald-400'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
                {statusCounts[tab.key] > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300'
                  }`}>
                    {statusCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Donation Cards Grid */}
          {filteredDonations.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 py-16 px-6 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-500">
                  {activeFilter === 'all' ? 'volunteer_activism' : activeFilter === 'success' ? 'check_circle' : activeFilter === 'pending' ? 'schedule' : 'cancel'}
                </span>
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                {activeFilter === 'all' ? 'Belum ada riwayat donasi' : `Tidak ada transaksi ${FILTER_TABS.find(t => t.key === activeFilter)?.label.toLowerCase()}`}
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-400/80 max-w-xs mx-auto">
                {activeFilter === 'all' ? 'Mari mulai menyebar kebaikan! Jelajahi program donasi kami.' : 'Coba pilih filter lain untuk melihat transaksi Anda.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDonations.map((tx) => (
                <DonationCard key={tx.id || tx.orderId} tx={tx} user={user} onPaymentSuccess={loadDonations} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedFields) => {
            updateUser(updatedFields);
            setShowEditModal(false);
            toast.success('Profil berhasil diperbarui! ✅');
          }}
        />
      )}
    </div>
  );
}

function EditProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    whatsapp: user?.whatsapp || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [passwordSection, setPasswordSection] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const updatePw = (field, value) => setPasswords((p) => ({ ...p, [field]: value }));

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, dll)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 2MB');
      return;
    }

    setAvatarFile(file);

    // Create preview using FileReader → base64
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.username.trim()) {
      toast.error('Username wajib diisi');
      return;
    }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      toast.error('Email tidak valid');
      return;
    }
    if (!form.whatsapp.trim() || !/^\d{10,13}$/.test(form.whatsapp)) {
      toast.error('Nomor WhatsApp tidak valid (10-13 digit)');
      return;
    }

    if (passwordSection) {
      if (!passwords.current) {
        toast.error('Masukkan password lama');
        return;
      }
      if (passwords.newPass.length < 6) {
        toast.error('Password baru minimal 6 karakter');
        return;
      }
      if (passwords.newPass !== passwords.confirm) {
        toast.error('Konfirmasi password tidak cocok');
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Simpan perubahan text (username, email, WA)
      const updatedFields = { ...form };
      let result = await updateProfile(updatedFields);

      // 2. Handle Ganti/Hapus Foto
      if (avatarFile) {
        // Upload foto sungguhan
        const uploadResult = await uploadAvatar(avatarFile);
        updatedFields.avatarUrl = uploadResult.user.avatarUrl;
        result.user.avatarUrl = uploadResult.user.avatarUrl;
      } else if (avatarPreview === null && user.avatarUrl) {
        // User menghapus fotonya
        await deleteAvatar();
        updatedFields.avatarUrl = null;
        result.user.avatarUrl = null;
      } else {
        // Tetap pakai avatar yang lama
        updatedFields.avatarUrl = user.avatarUrl;
      }

      // 3. Ubah password jika diminta
      if (passwordSection) {
        await changePassword({
          currentPassword: passwords.current,
          newPassword: passwords.newPass,
        });
        toast.success('Password berhasil diubah');
      }

      onSave(result.user);
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-xl mx-4 animate-scale-in overflow-hidden border border-outline-variant/20 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-800/80">
          <h2 className="text-2xl font-bold text-on-surface dark:text-white font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-primary dark:text-emerald-400">edit_square</span> Edit Profil
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto w-full max-w-full">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4 pb-6 border-b border-outline-variant/10 dark:border-slate-700">
            <div className="relative group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-surface-container dark:border-slate-800 shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary dark:bg-emerald-600 flex items-center justify-center shadow-md border-4 border-surface-container dark:border-slate-800">
                  <span className="text-4xl font-bold text-white">{form.username?.[0]?.toUpperCase() || 'U'}</span>
                </div>
              )}
              {/* Overlay camera icon on hover */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
              >
                <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-surface-container dark:bg-slate-700 text-xs font-bold text-on-surface dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">photo_library</span> Pilih Foto
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span> Hapus
                </button>
              )}
            </div>
            <p className="text-xs font-medium text-slate-400">Dimensi ideal 1:1 (JPG, PNG, WebP) maks. 2MB</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface dark:text-slate-200 mb-2">Username *</label>
            <input type="text" value={form.username} onChange={(e) => update('username', e.target.value)} className="w-full bg-surface-container/50 dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-medium" placeholder="ahmadrahmani" />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface dark:text-slate-200 mb-2">Email *</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full bg-surface-container/50 dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-medium" placeholder="ahmad@email.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface dark:text-slate-200 mb-2">Nomor WhatsApp *</label>
            <input type="text" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} className="w-full bg-surface-container/50 dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-medium" placeholder="081234567890" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">info</span> Untuk notifikasi donasi via WhatsApp</p>
          </div>

          {/* Change Password Toggle */}
          <div className="pt-2">
            <button onClick={() => setPasswordSection(!passwordSection)} className="text-sm font-bold flex items-center gap-1 text-primary hover:text-primary/70 transition-colors">
              <span className="material-symbols-outlined text-[18px]">{passwordSection ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}</span>
              Ubah Kata Sandi
            </button>
          </div>

          {passwordSection && (
            <div className="space-y-4 pt-4 pb-2 pl-6 border-l-4 border-primary/20 dark:border-emerald-500/30 animate-slide-down">
              <div>
                <label className="block text-sm font-bold text-on-surface dark:text-slate-200 mb-2">Kata Sandi Lama *</label>
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} value={passwords.current} onChange={(e) => updatePw('current', e.target.value)} className="w-full bg-surface-container/50 dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-medium pr-12" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-emerald-400 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">{showCurrent ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface dark:text-slate-200 mb-2">Kata Sandi Baru *</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={passwords.newPass} onChange={(e) => updatePw('newPass', e.target.value)} className="w-full bg-surface-container/50 dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-medium pr-12" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-emerald-400 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">{showNew ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {passwords.newPass && passwords.newPass.length < 6 && (
                  <p className="text-xs text-danger font-bold mt-1.5">Sandi minimal 6 karakter!</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface dark:text-slate-200 mb-2">Konfirmasi Sandi Baru *</label>
                <input type="password" value={passwords.confirm} onChange={(e) => updatePw('confirm', e.target.value)} className="w-full bg-surface-container/50 dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-medium" placeholder="••••••••" />
                {passwords.confirm && passwords.confirm !== passwords.newPass && (
                  <p className="text-xs text-danger font-bold mt-1.5">Sandi tidak cocok!</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-800/80 w-full mb-0 pb-6 rounded-b-[2rem]">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            Batal
          </button>
          <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary dark:bg-emerald-600 hover:bg-primary/90 dark:hover:bg-emerald-500 text-white font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Menyiapkan...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Simpan Perubahan</>}
          </button>
        </div>
      </div>
    </div>
  );
}
