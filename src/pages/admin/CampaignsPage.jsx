import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrencyShort } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import { getAllCampaigns, deleteCampaign } from '@/services/campaignService';
import toast from 'react-hot-toast';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await getAllCampaigns();
      setCampaigns(data);
    } catch {}
  };

  const handleDelete = (id, name) => {
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCampaign(deleteConfirm.id);
      toast.success(`Kampanye "${deleteConfirm.name}" berhasil dihapus`);
      loadCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
    setDeleteConfirm(null);
  };

  const filtered = campaigns
    .filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-admin-text">campaign</span>
          <h1 className="text-2xl font-bold text-admin-text tracking-tight">Manajemen Kampanye</h1>
        </div>
        <Link to="/admin-panel/campaigns/new" className="btn-admin-primary px-6 flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm">
          <span className="material-symbols-outlined text-[20px]">add</span> Buat Baru
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 bg-admin-bg-sidebar p-4 rounded-2xl border border-admin-border">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-[20px]">search</span>
          <input
            type="text"
            placeholder="Cari kampanye berdasarkan nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-admin pl-12 font-medium"
          />
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-[20px]">filter_list</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-admin pl-12 sm:w-48 font-medium appearance-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="draft">Draft</option>
            <option value="closed">Selesai</option>
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted pointer-events-none text-[20px]">expand_more</span>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-admin-text-muted flex flex-col items-center">
            <span className="material-symbols-outlined text-6xl opacity-30 mb-4">search_off</span>
            <p className="text-lg font-bold text-admin-text">Tidak ada kampanye ditemukan</p>
            <p className="text-sm mt-1">Coba ubah filter atau buat kampanye baru untuk donasi</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-admin-border bg-admin-bg-sidebar">
                    <th className="text-left px-5 py-4 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">#ID</th>
                    <th className="text-left px-5 py-4 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Info Program</th>
                    <th className="text-left px-5 py-4 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Kategori</th>
                    <th className="text-left px-5 py-4 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Penghimpunan</th>
                    <th className="text-left px-5 py-4 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Progress</th>
                    <th className="text-center px-5 py-4 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Status Akhir</th>
                    <th className="text-center px-5 py-4 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {filtered.map((c) => {
                    const progress = c.target > 0 ? Math.round((c.collected / c.target) * 100) : 0;
                    return (
                      <tr key={c.id} className="hover:bg-admin-bg-hover transition-colors">
                        <td className="px-5 py-4 text-admin-text-muted font-mono font-medium text-xs">#{c.id}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-admin-bg border border-admin-border">
                              {(c.imageUrl || c.image) ? (
                                <img src={c.imageUrl || c.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-admin-text-muted bg-admin-bg-sidebar">
                                  <span className="material-symbols-outlined text-[20px]">image</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="text-admin-text font-bold block mb-0.5">{c.title}</span>
                              <span className="text-xs text-admin-text-muted font-medium">Batas: {c.endDate ? formatDateShort(c.endDate) : 'Tanpa batas'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center w-max gap-1.5 uppercase tracking-wider ${
                            c.category === 'infaq' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                            : c.category === 'wakaf' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-admin-accent/10 text-admin-accent border border-admin-accent/20'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {c.category === 'infaq' ? 'volunteer_activism' 
                               : c.category === 'wakaf' ? 'real_estate_agent' 
                               : 'loyalty'}
                            </span>
                            {c.category === 'infaq' ? 'Infaq' : c.category === 'wakaf' ? 'Wakaf' : c.category}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-admin-accent font-mono font-bold">{formatCurrencyShort(c.collected)}</span>
                            <span className="text-xs text-admin-text-muted font-mono mt-0.5">/ {formatCurrencyShort(c.target)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5 min-w-[100px]">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-admin-text-secondary font-medium">Dana</span>
                              <span className="text-admin-text font-bold font-mono">{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-admin-bg overflow-hidden border border-admin-border">
                              <div className="h-full rounded-full bg-admin-accent-secondary" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                            c.status === 'active' ? 'bg-success/10 text-success border border-success/20' :
                            c.status === 'draft' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-admin-bg text-admin-text-muted border border-admin-border'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-success' : c.status === 'draft' ? 'bg-warning' : 'bg-admin-text-muted'}`}></span>
                            {c.status === 'active' ? 'Aktif' : c.status === 'draft' ? 'Draft' : 'Selesai'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <Link to={`/admin-panel/campaigns/${c.id}`} className="p-2 rounded-lg bg-admin-bg-sidebar border border-admin-border text-admin-text-secondary hover:text-admin-accent hover:border-admin-accent/50 transition-colors" title="Ubah Program">
                              <span className="material-symbols-outlined text-[18px]">edit_square</span>
                            </Link>
                            <Link to={`/explore/${c.id}`} target="_blank" className="p-2 rounded-lg bg-admin-bg-sidebar border border-admin-border text-admin-text-secondary hover:text-admin-text hover:border-admin-text/50 transition-colors" title="Lihat Pratinjau User">
                              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                            </Link>
                            <button onClick={() => handleDelete(c.id, c.title)} className="p-2 rounded-lg bg-admin-bg-sidebar border border-admin-border text-admin-text-secondary hover:text-danger hover:border-danger/50 transition-colors" title="Hapus Permanen">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border bg-admin-bg-sidebar text-xs text-admin-text-muted font-medium">
              <span>Menampilkan total <strong className="text-admin-text">{filtered.length}</strong> entri kampanye terdaftar</span>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-admin-bg/90 backdrop-blur-sm animate-fade-in px-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-admin-bg-card border border-admin-border rounded-xl p-6 w-full max-w-md shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <h3 className="text-xl font-bold text-admin-text">Verifikasi Penghapusan</h3>
            <p className="text-sm text-admin-text-secondary mt-2 leading-relaxed">
              Apakah Anda benar-benar yakin ingin memusnahkan kampanye <strong className="text-admin-text">"{deleteConfirm.name}"</strong>? Data donasi yang terikat mungkin akan menjadi anomali atau tidak dapat diakses lagi. Aksi ini mutlak dan tidak bisa dikembalikan.
            </p>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setDeleteConfirm(null)} className="btn-admin-ghost font-bold border border-admin-border px-5">Batalkan</button>
              <button onClick={confirmDelete} className="px-5 py-2.5 bg-danger text-white text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:bg-red-600 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">delete_forever</span> Eksekusi Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
