import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Image } from 'lucide-react';
import { getCampaignById, createCampaign, updateCampaign } from '@/services/campaignService';
import toast from 'react-hot-toast';

export default function CampaignFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '',
    category: 'infaq',
    target: '',
    endDate: '',
    status: 'draft',
    description: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const campaign = await getCampaignById(id);
          if (campaign) {
            setForm({
              title: campaign.title,
              category: campaign.category,
              target: campaign.target.toString(),
              endDate: campaign.endDate || '',
              status: campaign.status,
              description: campaign.description || '',
            });
            setImagePreview(campaign.imageUrl || campaign.image);
          } else {
            toast.error('Kampanye tidak ditemukan');
            navigate('/admin-panel/campaigns');
          }
        } catch {
          toast.error('Kampanye tidak ditemukan');
          navigate('/admin-panel/campaigns');
        }
      })();
    }
  }, [id]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }
    setImageFile(file); // Save the actual file
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleImageChange(fakeEvent);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Nama program wajib diisi');
      return;
    }
    if (!form.target || Number(form.target) <= 0) {
      toast.error('Target dana harus lebih dari 0');
      return;
    }
    if (!imagePreview) {
      toast.error('Gambar kampanye wajib diupload');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Deskripsi program wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('target', form.target);
      formData.append('status', form.status);
      formData.append('description', form.description);
      if (form.endDate) formData.append('endDate', form.endDate);
      
      // If a new file was chosen, append it
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imagePreview && !imagePreview.startsWith('data:')) {
        // Keeping the old imageUrl if it has not changed
        formData.append('imageUrl', imagePreview);
      }

      if (isEdit) {
        await updateCampaign(id, formData);
        toast.success('Kampanye berhasil diperbarui! ✅');
      } else {
        await createCampaign(formData);
        toast.success('Kampanye baru berhasil dibuat! 🎉');
      }
      navigate('/admin-panel/campaigns');
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin-panel/campaigns" className="p-2 rounded-admin hover:bg-admin-bg-hover text-admin-text-secondary hover:text-admin-text transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-admin-text">
            {isEdit ? '✏️ Edit Kampanye' : '📝 Buat Kampanye Baru'}
          </h1>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-admin-primary text-sm">
          {loading ? <span className="animate-pulse">Menyimpan...</span> : <><Save size={16} /> Simpan</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="admin-card p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Nama Program *</label>
              <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Renovasi Masjid Al-Ikhlas" className="input-admin !font-sans" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Kategori *</label>
                <select value={form.category} onChange={(e) => update('category', e.target.value)} className="input-admin !font-sans">
                  <option value="infaq">Infaq</option>
                  <option value="wakaf">Wakaf</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Target Dana (Rp) *</label>
                <input type="number" value={form.target} onChange={(e) => update('target', e.target.value)} placeholder="100000000" className="input-admin" min="0" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Tanggal Berakhir</label>
                <input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} className="input-admin" />
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input-admin !font-sans">
                  <option value="draft">Draft</option>
                  <option value="active">Aktif</option>
                  <option value="closed">Selesai</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Deskripsi Program *</label>
              <div className="border border-admin-border rounded-admin overflow-hidden">
                <div className="flex gap-1 px-3 py-2 border-b border-admin-border bg-admin-bg-sidebar flex-wrap">
                  {[
                    { label: 'B', action: () => wrapText('**', '**') },
                    { label: 'I', action: () => wrapText('<em>', '</em>') },
                    { label: 'H2', action: () => prependText('<h2>', '</h2>') },
                    { label: '• List', action: () => prependText('<ul><li>', '</li></ul>') },
                    { label: '🔗 Link', action: () => wrapText('<a href="">', '</a>') },
                  ].map((btn) => (
                    <button key={btn.label} type="button" onClick={btn.action} className="px-2 py-1 rounded text-xs text-admin-text-secondary hover:bg-admin-bg-hover hover:text-admin-text transition-colors font-mono">
                      {btn.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Tulis deskripsi lengkap tentang program donasi ini... (mendukung HTML)"
                  rows={10}
                  className="w-full px-4 py-3 bg-admin-bg text-admin-text placeholder-admin-text-muted focus:outline-none resize-none font-sans text-sm"
                />
              </div>
              <p className="text-xs text-admin-text-muted mt-1">Mendukung HTML. TipTap editor akan diintegrasi kemudian.</p>
            </div>
          </div>
        </div>

        {/* Right — Image Upload & Preview */}
        <div className="space-y-6">
          <div className="admin-card p-6">
            <label className="block text-sm font-medium text-admin-text-secondary mb-3">Gambar Kampanye *</label>
            
            {imagePreview ? (
              <div className="relative group rounded-admin overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white/20 rounded-admin text-white hover:bg-white/30 transition-colors" title="Ganti gambar">
                    <Image size={20} />
                  </button>
                  <button onClick={removeImage} className="p-2 bg-red-500/80 rounded-admin text-white hover:bg-red-600 transition-colors" title="Hapus gambar">
                    <X size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleImageDrop}
                className="border-2 border-dashed border-admin-border rounded-admin p-8 text-center hover:border-admin-accent transition-colors cursor-pointer"
              >
                <Upload size={32} className="mx-auto text-admin-text-muted mb-2" />
                <p className="text-sm text-admin-text-secondary">Klik atau drag & drop gambar</p>
                <p className="text-xs text-admin-text-muted mt-1">JPG, PNG, WebP — maks 5MB</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Quick Info */}
          <div className="admin-card p-4 border-l-2 border-l-admin-accent">
            <h3 className="text-sm font-semibold text-admin-text mb-2">💡 Tips</h3>
            <ul className="text-xs text-admin-text-muted space-y-1">
              <li>• Gunakan gambar landscape (16:9) untuk hasil terbaik</li>
              <li>• Status "Draft" tidak tampil di halaman user</li>
              <li>• Status "Aktif" akan langsung tampil di Jelajahi</li>
              <li>• Deskripsi mendukung format HTML</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for basic text formatting
function wrapText(before, after) {
  // Simple placeholder — will be replaced by TipTap
}
function prependText(before, after) {
  // Simple placeholder — will be replaced by TipTap
}
