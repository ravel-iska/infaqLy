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

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [donationHistory, setDonationHistory] = useState([]);

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

        {/* Donation History */}
        <div className="mt-10">
          <h2 className="text-2xl font-extrabold text-on-surface mb-6 font-headline tracking-tight">Riwayat Donasi</h2>
          <div className="bg-surface-container-lowest rounded-[1.5rem] border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container/50">
                    <th className="text-left px-6 py-4 font-bold text-on-surface-variant uppercase tracking-wider text-xs">Tanggal</th>
                    <th className="text-left px-6 py-4 font-bold text-on-surface-variant uppercase tracking-wider text-xs">Program</th>
                    <th className="text-left px-6 py-4 font-bold text-on-surface-variant uppercase tracking-wider text-xs">Nominal</th>
                    <th className="text-center px-6 py-4 font-bold text-on-surface-variant uppercase tracking-wider text-xs">Status</th>
                    <th className="text-center px-6 py-4 font-bold text-on-surface-variant uppercase tracking-wider text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {donationHistory.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant font-medium">Belum ada riwayat donasi. Mari mulai menyebar kebaikan!</td></tr>
                  ) : donationHistory.map((tx) => (
                    <tr key={tx.id || tx.orderId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 text-on-surface font-medium">{formatDateShort(tx.createdAt)}</td>
                      <td className="px-6 py-5 text-on-surface font-bold">{tx.donorName || '-'}</td>
                      <td className="px-6 py-5 text-primary font-bold">{formatCurrency(tx.amount)}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                          tx.paymentStatus === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          tx.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {tx.paymentStatus === 'success' ? 'check_circle' : tx.paymentStatus === 'pending' ? 'schedule' : 'cancel'}
                          </span>
                          {tx.paymentStatus === 'success' ? 'Berhasil' : tx.paymentStatus === 'pending' ? 'Menunggu' : 'Gagal'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {tx.paymentStatus === 'success' ? (
                          <button
                            onClick={() => {
                              generateCertificate({
                                donorName: user?.username || 'Donatur',
                                program: tx.donorName || 'Program',
                                amount: tx.amount,
                                date: tx.createdAt,
                                transactionId: tx.orderId,
                              });
                              toast.success('Sertifikat berhasil diunduh');
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container hover:bg-primary hover:text-white text-primary transition-all shadow-sm"
                            title="Unduh Sertifikat"
                          >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant font-medium mt-4 text-center flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-[14px]">info</span> Tersedia fasilitas Unduh Sertifikat khusus untuk transaksi yang Berhasil.</p>
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
