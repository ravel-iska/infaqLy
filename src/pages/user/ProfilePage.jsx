import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import { generateCertificate } from '@/utils/generateCertificate';
import { updateProfile, changePassword, uploadAvatar, deleteAvatar } from '@/services/authService';
import api from '@/services/api';
import { Edit, Download, Mail, Phone, X, Save, Eye, EyeOff, Camera, Trash2 } from 'lucide-react';
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
    <div className="animate-fade-in py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Card */}
        <div className="user-card p-6 border-l-4 border-l-user-accent">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar user={user} size="lg" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-user-text">{user?.username || 'User'}</h1>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1 text-sm text-user-text-secondary">
                <span className="flex items-center gap-1"><Mail size={14} /> {user?.email || 'email@example.com'}</span>
                <span className="flex items-center gap-1"><Phone size={14} /> {user?.whatsapp || '081234567890'}</span>
              </div>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="btn-user-ghost !py-2 !px-4 text-sm"
            >
              <Edit size={14} /> Edit Profil
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="user-card p-5 text-center">
            <p className="text-sm text-user-text-secondary">💰 Total Donasi Saya</p>
            <p className="text-xl font-bold text-user-text mt-1">{formatCurrency(totalDonated)}</p>
          </div>
          <div className="user-card p-5 text-center">
            <p className="text-sm text-user-text-secondary">🔄 Total Transaksi</p>
            <p className="text-xl font-bold text-user-text mt-1">{donationHistory.length} kali</p>
          </div>
          <div className="user-card p-5 text-center">
            <p className="text-sm text-user-text-secondary">📋 Program Dibantu</p>
            <p className="text-xl font-bold text-user-text mt-1">{uniquePrograms} program</p>
          </div>
        </div>

        {/* Donation History */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-user-text mb-4">Riwayat Donasi</h2>
          <div className="user-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-user-border bg-gray-50">
                    <th className="text-left px-5 py-3 font-semibold text-user-text-secondary">Tanggal</th>
                    <th className="text-left px-5 py-3 font-semibold text-user-text-secondary">Program</th>
                    <th className="text-left px-5 py-3 font-semibold text-user-text-secondary">Nominal</th>
                    <th className="text-center px-5 py-3 font-semibold text-user-text-secondary">Status</th>
                    <th className="text-center px-5 py-3 font-semibold text-user-text-secondary">📄</th>
                  </tr>
                </thead>
                <tbody>
                  {donationHistory.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-user-text-muted">Belum ada riwayat donasi</td></tr>
                  ) : donationHistory.map((tx) => (
                    <tr key={tx.id || tx.orderId} className="border-b border-user-border last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-user-text">{formatDateShort(tx.createdAt)}</td>
                      <td className="px-5 py-4 text-user-text font-medium">{tx.donorName || '-'}</td>
                      <td className="px-5 py-4 text-user-accent font-semibold">{formatCurrency(tx.amount)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={tx.paymentStatus === 'success' ? 'badge-success' : tx.paymentStatus === 'pending' ? 'badge-warning' : 'badge-danger'}>
                          {tx.paymentStatus === 'success' ? '✅ Berhasil' : tx.paymentStatus === 'pending' ? '⏳ Menunggu' : '❌ ' + tx.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
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
                              toast.success('Sertifikat dibuka di tab baru');
                            }}
                            className="text-user-accent hover:text-user-accent-hover transition-colors"
                            title="Unduh Sertifikat"
                          >
                            <Download size={16} />
                          </button>
                        ) : (
                          <span className="text-user-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-user-text-muted mt-3 text-center">📄 = Unduh Sertifikat PDF (hanya untuk transaksi berhasil)</p>
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
      <div className="bg-white rounded-2xl shadow-user-lg w-full max-w-lg mx-4 animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-user-border">
          <h2 className="text-lg font-bold text-user-text">✏️ Edit Profil</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-user-text-muted hover:text-user-text transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3 pb-5 border-b border-user-border">
            <div className="relative group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-user-accent" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-user-accent flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{form.username?.[0]?.toUpperCase() || 'U'}</span>
                </div>
              )}
              {/* Overlay camera icon on hover */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera size={24} className="text-white" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-user-accent hover:text-user-accent-hover transition-colors cursor-pointer"
              >
                📷 Ganti Foto
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="text-xs font-medium text-danger hover:text-red-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} /> Hapus
                </button>
              )}
            </div>
            <p className="text-xs text-user-text-muted">JPG, PNG, atau WebP — Maks. 2MB</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-user-text mb-1.5">Username *</label>
            <input type="text" value={form.username} onChange={(e) => update('username', e.target.value)} className="input-user" placeholder="ahmadrahmani" />
          </div>
          <div>
            <label className="block text-sm font-medium text-user-text mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-user" placeholder="ahmad@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-user-text mb-1.5">Nomor WhatsApp *</label>
            <input type="text" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} className="input-user" placeholder="081234567890" />
            <p className="text-xs text-user-text-muted mt-1">Digunakan untuk notifikasi donasi via WhatsApp</p>
          </div>

          {/* Change Password Toggle */}
          <div className="pt-2">
            <button onClick={() => setPasswordSection(!passwordSection)} className="text-sm font-medium text-user-accent hover:text-user-accent-hover transition-colors">
              {passwordSection ? '▾ Sembunyikan Ubah Password' : '▸ Ubah Password'}
            </button>
          </div>

          {passwordSection && (
            <div className="space-y-4 pt-2 pb-2 pl-4 border-l-2 border-user-accent-light animate-slide-down">
              <div>
                <label className="block text-sm font-medium text-user-text mb-1.5">Password Lama *</label>
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} value={passwords.current} onChange={(e) => updatePw('current', e.target.value)} className="input-user pr-12" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-user-text-muted hover:text-user-text transition-colors">
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-user-text mb-1.5">Password Baru *</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={passwords.newPass} onChange={(e) => updatePw('newPass', e.target.value)} className="input-user pr-12" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-user-text-muted hover:text-user-text transition-colors">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwords.newPass && passwords.newPass.length < 6 && (
                  <p className="text-xs text-danger mt-1">Password minimal 6 karakter</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-user-text mb-1.5">Konfirmasi Password Baru *</label>
                <input type="password" value={passwords.confirm} onChange={(e) => updatePw('confirm', e.target.value)} className="input-user" placeholder="••••••••" />
                {passwords.confirm && passwords.confirm !== passwords.newPass && (
                  <p className="text-xs text-danger mt-1">Password tidak cocok</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-user-border bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-user-text-secondary hover:text-user-text transition-colors">
            Batal
          </button>
          <button onClick={handleSave} disabled={loading} className="btn-user-primary !py-2.5 !px-5 text-sm">
            {loading ? <span className="animate-pulse">Menyimpan...</span> : <><Save size={16} /> Simpan Perubahan</>}
          </button>
        </div>
      </div>
    </div>
  );
}
