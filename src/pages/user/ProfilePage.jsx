import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import { generateCertificate } from '@/utils/generateCertificate';
import { updateProfile, changePassword, uploadAvatar, deleteAvatar } from '@/services/authService';
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
function DonationCard({ tx, user }) {
  const [downloading, setDownloading] = useState(false);

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

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 hover:border-primary/20 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      {/* Top row: Date + Status badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
          {formatDateShort(tx.createdAt)}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full ${status.bg} ${status.text} border ${status.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
          {status.label}
        </span>
      </div>

      {/* Program name */}
      <h3 className="text-base font-bold text-on-surface leading-snug mb-1 line-clamp-1">
        {tx.donorName || 'Program Donasi'}
      </h3>

      {/* Amount */}
      <p className="text-lg font-extrabold text-primary font-headline">
        {formatCurrency(tx.amount)}
      </p>

      {/* Divider */}
      <div className="h-px bg-slate-100 my-4"></div>

      {/* Bottom row: Order ID + Download */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono text-slate-300 truncate max-w-[160px]">
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
          <span className="text-[11px] font-medium text-amber-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
            Menunggu pembayaran
          </span>
        ) : (
          <span className="text-[11px] font-medium text-slate-300">
            Transaksi gagal
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

  // Load user's donation history from database
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/donations/me');
        setDonationHistory(data.donations || []);
      } catch {}
    })();
  }, []);

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Card */}
        <div className="bg-surface-container-lowest p-6 md:p-8 rounded-[2rem] border border-outline-variant/20 shadow-ambient flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary-container"></div>
          <Avatar user={user} size="lg" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-on-surface font-headline">{user?.username || 'User Explorer'}</h1>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-3 text-sm text-on-surface-variant font-medium">
              <span className="flex items-center justify-center sm:justify-start gap-1.5"><span className="material-symbols-outlined text-[16px]">mail</span> {user?.email || 'email@example.com'}</span>
              <span className="flex items-center justify-center sm:justify-start gap-1.5"><span className="material-symbols-outlined text-[16px]">phone</span> {user?.whatsapp || 'Belum diisi'}</span>
            </div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span> Edit Profil
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] border border-outline-variant/10 text-center shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
            <span className="material-symbols-outlined text-3xl text-primary/20 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform">account_balance_wallet</span>
            <p className="text-sm text-on-surface-variant font-medium">Total Donasi Saya</p>
            <p className="text-2xl font-bold text-primary mt-2 font-headline">{formatCurrency(totalDonated)}</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] border border-outline-variant/10 text-center shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
            <span className="material-symbols-outlined text-3xl text-primary/20 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform">receipt_long</span>
            <p className="text-sm text-on-surface-variant font-medium">Total Transaksi</p>
            <p className="text-2xl font-bold text-on-surface mt-2 font-headline">{donationHistory.length} Kali</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] border border-outline-variant/10 text-center shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
            <span className="material-symbols-outlined text-3xl text-primary/20 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform">volunteer_activism</span>
            <p className="text-sm text-on-surface-variant font-medium">Program Dibantu</p>
            <p className="text-2xl font-bold text-on-surface mt-2 font-headline">{uniquePrograms} Program</p>
          </div>
        </div>

        {/* ── Donation History — Card Layout ── */}
        <div className="mt-10">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-extrabold text-on-surface font-headline tracking-tight">Riwayat Donasi</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Sertifikat tersedia untuk transaksi berhasil
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                  activeFilter === tab.key
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white text-slate-500 border border-slate-100 hover:border-primary/20 hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
                {statusCounts[tab.key] > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {statusCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Donation Cards Grid */}
          {filteredDonations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-16 px-6 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-slate-300">
                  {activeFilter === 'all' ? 'volunteer_activism' : activeFilter === 'success' ? 'check_circle' : activeFilter === 'pending' ? 'schedule' : 'cancel'}
                </span>
              </div>
              <p className="text-base font-bold text-slate-800 mb-1">
                {activeFilter === 'all' ? 'Belum ada riwayat donasi' : `Tidak ada transaksi ${FILTER_TABS.find(t => t.key === activeFilter)?.label.toLowerCase()}`}
              </p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                {activeFilter === 'all' ? 'Mari mulai menyebar kebaikan! Jelajahi program donasi kami.' : 'Coba pilih filter lain untuk melihat transaksi Anda.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDonations.map((tx) => (
                <DonationCard key={tx.id || tx.orderId} tx={tx} user={user} />
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
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl mx-4 animate-scale-in overflow-hidden border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 bg-surface-container-lowest">
          <h2 className="text-2xl font-bold text-on-surface font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_square</span> Edit Profil
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form */}
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4 pb-6 border-b border-outline-variant/10">
            <div className="relative group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-surface-container shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-md border-4 border-surface-container">
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
                className="px-4 py-2 rounded-lg bg-surface-container text-xs font-bold text-on-surface hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">photo_library</span> Pilih Foto
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="px-4 py-2 rounded-lg bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span> Hapus
                </button>
              )}
            </div>
            <p className="text-xs font-medium text-slate-400">Dimensi ideal 1:1 (JPG, PNG, WebP) maks. 2MB</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Username *</label>
            <input type="text" value={form.username} onChange={(e) => update('username', e.target.value)} className="w-full bg-surface-container/50 border border-outline-variant/30 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" placeholder="ahmadrahmani" />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Email *</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full bg-surface-container/50 border border-outline-variant/30 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" placeholder="ahmad@email.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Nomor WhatsApp *</label>
            <input type="text" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} className="w-full bg-surface-container/50 border border-outline-variant/30 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" placeholder="081234567890" />
            <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">info</span> Untuk notifikasi donasi via WhatsApp</p>
          </div>

          {/* Change Password Toggle */}
          <div className="pt-2">
            <button onClick={() => setPasswordSection(!passwordSection)} className="text-sm font-bold flex items-center gap-1 text-primary hover:text-primary/70 transition-colors">
              <span className="material-symbols-outlined text-[18px]">{passwordSection ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}</span>
              Ubah Kata Sandi
            </button>
          </div>

          {passwordSection && (
            <div className="space-y-4 pt-4 pb-2 pl-6 border-l-4 border-primary/20 animate-slide-down">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Kata Sandi Lama *</label>
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} value={passwords.current} onChange={(e) => updatePw('current', e.target.value)} className="w-full bg-surface-container/50 border border-outline-variant/30 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium pr-12" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">{showCurrent ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Kata Sandi Baru *</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={passwords.newPass} onChange={(e) => updatePw('newPass', e.target.value)} className="w-full bg-surface-container/50 border border-outline-variant/30 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium pr-12" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">{showNew ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {passwords.newPass && passwords.newPass.length < 6 && (
                  <p className="text-xs text-danger font-bold mt-1.5">Sandi minimal 6 karakter!</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Konfirmasi Sandi Baru *</label>
                <input type="password" value={passwords.confirm} onChange={(e) => updatePw('confirm', e.target.value)} className="w-full bg-surface-container/50 border border-outline-variant/30 text-on-surface placeholder:text-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" placeholder="••••••••" />
                {passwords.confirm && passwords.confirm !== passwords.newPass && (
                  <p className="text-xs text-danger font-bold mt-1.5">Sandi tidak cocok!</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 bg-surface-container-lowest">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
            Batal
          </button>
          <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Menyiapkan...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Simpan Perubahan</>}
          </button>
        </div>
      </div>
    </div>
  );
}
