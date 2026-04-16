import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  const [isCustomCategory, setIsCustomCategory] = useState(false);
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
            // If the loaded category is not standard, show custom input
            if (campaign.category !== 'infaq' && campaign.category !== 'wakaf') {
              setIsCustomCategory(true);
            }
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
  }, [id, navigate, isEdit]);

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
    if (!form.category.trim()) {
      toast.error('Kategori wajib diisi');
      return;
    }
    if (!imagePreview) {
      toast.error('Gambar kampanye wajib diunggah');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Deskripsi program wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('category', form.category.trim());
      formData.append('target', form.target);
      formData.append('status', form.status);
      formData.append('description', form.description.trim());
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
        toast.success('Kampanye berhasil diperbarui!');
      } else {
        await createCampaign(formData);
        toast.success('Kampanye baru berhasil dibuat!');
      }
      navigate('/admin-panel/campaigns');
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link to="/admin-panel/campaigns" className="p-2 rounded-xl border border-transparent hover:border-admin-border hover:bg-admin-bg-sidebar text-admin-text-secondary hover:text-admin-text transition-all">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[28px] ${isEdit ? 'text-admin-accent' : 'text-success'}`}>
              {isEdit ? 'edit_square' : 'add_box'}
            </span>
            <h1 className="text-2xl font-bold text-admin-text tracking-tight">
              {isEdit ? 'Modifikasi Kampanye' : 'Buat Kampanye Baru'}
            </h1>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-admin-primary px-6 w-full sm:w-auto flex items-center justify-center gap-2 shadow-sm">
          {loading ? (
            <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Menyimpan...</>
          ) : (
            <><span className="material-symbols-outlined text-[18px]">save</span> Simpan Kampanye</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="admin-card p-6 border border-admin-border space-y-5">
            <div>
              <label className="block text-sm font-semibold text-admin-text-secondary mb-2">Nama Acara/Program <span className="text-danger">*</span></label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-[20px]">title</span>
                <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Contoh: Renovasi Masjid Al-Ikhlas" className="input-admin pl-12 font-medium" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-admin-text-secondary">Kategori <span className="text-danger">*</span></label>
                  {!isCustomCategory && (
                    <button type="button" onClick={() => { setIsCustomCategory(true); update('category', ''); }} className="text-[11px] font-bold uppercase tracking-wider text-admin-accent hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">edit</span> Kostum
                    </button>
                  )}
                </div>
                {isCustomCategory ? (
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-[20px]">category</span>
                    <input 
                      type="text" 
                      value={form.category} 
                      onChange={(e) => update('category', e.target.value)} 
                      placeholder="Ketikan kategori..." 
                      className="input-admin pl-12 pr-10 font-medium" 
                      autoFocus
                    />
                    <button 
                      type="button" 
                      onClick={() => { setIsCustomCategory(false); update('category', 'infaq'); }} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-text-muted hover:text-danger rounded-full p-1"
                      title="Batalkan Kategori Kustom"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-[20px]">category</span>
                    <select value={form.category} onChange={(e) => update('category', e.target.value)} className="input-admin pl-12 sm:w-full font-medium appearance-none">
                      <option value="infaq">Kategori Infaq</option>
                      <option value="wakaf">Kategori Wakaf</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted pointer-events-none text-[20px]">expand_more</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-admin-text-secondary mb-2">Target Dana (Rp) <span className="text-danger">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-admin-text-muted">Rp</span>
                  <input type="number" value={form.target} onChange={(e) => update('target', e.target.value)} placeholder="0" className="input-admin pl-12 font-mono font-bold tracking-wider" min="0" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-admin-text-secondary mb-2">Batas Periode (Tenggat)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-[20px]">calendar_month</span>
                  <input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} className="input-admin pl-12 font-medium" />
                </div>
                <p className="text-[10px] text-admin-text-muted mt-1.5 ml-1">Kosongkan jika kampanye berjalan abadi/sepanjang waktu.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-admin-text-secondary mb-2">Status Penayangan</label>
                <div className="relative">
                   <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-[20px]">visibility</span>
                  <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input-admin pl-12 sm:w-full font-medium appearance-none">
                    <option value="draft">Mode Draft (Tersembunyi)</option>
                    <option value="active">Mode Aktif (Publik)</option>
                    <option value="closed">Selesai (Tutup)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted pointer-events-none text-[20px]">expand_more</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text-secondary mb-2">Cerita / Deskripsi <span className="text-danger">*</span></label>
              <div className="border border-admin-border rounded-xl overflow-hidden bg-admin-bg-sidebar">
                <div className="flex gap-1.5 px-3 py-2.5 border-b border-admin-border bg-admin-bg flex-wrap">
                  {[
                    { icon: 'format_bold', label: 'B', action: () => wrapText('**', '**') },
                    { icon: 'format_italic', label: 'I', action: () => wrapText('<em>', '</em>') },
                    { icon: 'title', label: 'H2', action: () => prependText('<h2>', '</h2>') },
                    { icon: 'format_list_bulleted', label: 'List', action: () => prependText('<ul><li>', '</li></ul>') },
                    { icon: 'link', label: 'Link', action: () => wrapText('<a href="">', '</a>') },
                  ].map((btn, i) => (
                    <button key={i} type="button" onClick={btn.action} className="p-1 min-w-8 flex items-center justify-center rounded text-admin-text-secondary hover:bg-admin-border hover:text-admin-text transition-colors" title={btn.label}>
                       <span className="material-symbols-outlined text-[18px]">{btn.icon}</span>
                    </button>
                  ))}
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Ketikkan narasi menyentuh kalbu yang mendeskripsikan secara lengkap mengenai kegiatan/kampanye amal ini. Dapat disisipkan HTML / Markdown secara manual."
                  rows={10}
                  className="w-full px-4 py-4 bg-admin-bg-sidebar text-admin-text placeholder-admin-text-muted/50 focus:outline-none resize-y font-medium text-sm border-none ring-0 placeholder:font-normal"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right — Image Upload & Preview */}
        <div className="space-y-6">
          <div className="admin-card p-6 border border-admin-border">
             <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-admin-accent-secondary">add_photo_alternate</span>
                <h3 className="text-sm font-semibold text-admin-text">Thumbnail Visual <span className="text-danger">*</span></h3>
             </div>
            
            {imagePreview ? (
              <div className="relative group rounded-xl overflow-hidden border border-admin-border shadow-inner">
                <img src={imagePreview} alt="Preview" className="w-full h-48 sm:h-56 object-cover" />
                <div className="absolute inset-0 bg-admin-bg/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-admin-bg-sidebar border border-admin-border rounded-lg text-admin-text hover:text-admin-accent hover:border-admin-accent transition-colors shadow-lg" title="Ganti Visual">
                    <span className="material-symbols-outlined text-[20px]">find_replace</span>
                  </button>
                  <button onClick={removeImage} className="p-2.5 bg-danger/10 border border-danger/30 rounded-lg text-danger hover:bg-danger hover:text-white transition-colors shadow-lg" title="Hapus Visual">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleImageDrop}
                className="border-2 border-dashed border-admin-border bg-admin-bg-sidebar rounded-xl p-8 flex flex-col items-center justify-center hover:border-admin-accent hover:bg-admin-accent/5 transition-all text-center cursor-pointer min-h-[224px]"
              >
                <div className="w-16 h-16 rounded-full bg-admin-bg border border-admin-border shadow-sm flex items-center justify-center text-admin-text-muted mb-4">
                  <span className="material-symbols-outlined text-[32px]">upload_file</span>
                </div>
                <p className="text-sm font-bold text-admin-text mb-1">Letakkan gambar disini</p>
                <p className="text-xs text-admin-text-muted font-medium">Atau klik untuk menelusuri (Max: 5MB)</p>
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
          <div className="admin-card p-5 border border-admin-border border-l-4 border-l-warning bg-warning/5">
            <div className="flex items-center gap-2 mb-3">
               <span className="material-symbols-outlined text-warning text-[20px]">lightbulb</span>
               <h3 className="text-sm font-bold text-admin-text">Petunjuk Singkat</h3>
            </div>
            <ul className="text-xs text-admin-text-secondary space-y-2.5 font-medium">
              <li className="flex items-start gap-1.5"><span className="material-symbols-outlined text-[14px] mt-0.5 opacity-50">check</span> Proporsi optimal gambar landscape (16:9) direkomendasikan.</li>
              <li className="flex items-start gap-1.5"><span className="material-symbols-outlined text-[14px] mt-0.5 opacity-50">check</span> Status "Draft" memastikan publikasi tetap tersembunyi hingga siap rilis.</li>
              <li className="flex items-start gap-1.5"><span className="material-symbols-outlined text-[14px] mt-0.5 text-success">check</span> Status "Aktif" langsung tayang di portal Jelajah (Umum).</li>
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
