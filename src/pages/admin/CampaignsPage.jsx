import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrencyShort } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import { getAllCampaigns, deleteCampaign } from '@/services/campaignService';
import toast from 'react-hot-toast';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
    } catch { } finally {
      setIsLoading(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-base-content/5 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] text-white drop-shadow-sm">campaign</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight font-headline">Manajemen Kampanye</h1>
        </div>
        <Link to="/admin-panel/campaigns/new" className="btn btn-primary px-6 flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm">
          <span className="material-symbols-outlined text-[20px]">add</span> Buat Baru
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 bg-gradient-to-br from-base-100 to-base-200/50 backdrop-blur-md p-4 rounded-2xl border border-white/10 dark:border-base-content/5 shadow-xl shadow-base-200/40 relative z-10">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 text-[20px]">search</span>
          <input
            type="text"
            placeholder="Cari kampanye berdasarkan nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full pl-12 font-medium"
          />
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 text-[20px]">filter_list</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select select-bordered w-full pl-12 sm:w-48 font-medium appearance-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="draft">Draft</option>
            <option value="completed">Selesai</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gradient-to-b from-base-100 to-base-200/20 backdrop-blur-md shadow-2xl shadow-base-200/50 rounded-[1.5rem] border border-white/10 dark:border-base-content/5 overflow-hidden relative z-10">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-base-content/50 flex flex-col items-center">
            <span className="material-symbols-outlined text-6xl opacity-30 mb-4">search_off</span>
            <p className="text-lg font-bold text-base-content">Tidak ada kampanye ditemukan</p>
            <p className="text-sm mt-1">Coba ubah filter atau buat kampanye baru untuk donasi</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-zebra table-md w-full">
                <thead>
                  <tr className="bg-base-200/80 text-base-content/70">
                    <th className="font-bold uppercase tracking-wider">#ID</th>
                    <th className="font-bold uppercase tracking-wider">Info Program</th>
                    <th className="font-bold uppercase tracking-wider">Kategori</th>
                    <th className="font-bold uppercase tracking-wider">Penghimpunan</th>
                    <th className="font-bold uppercase tracking-wider">Progress</th>
                    <th className="text-center font-bold uppercase tracking-wider">Status Akhir</th>
                    <th className="text-center font-bold uppercase tracking-wider">Kelola</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={`skel-${i}`} className="animate-pulse">
                        <td><div className="w-8 h-4 bg-base-200 rounded"></div></td>
                        <td>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-base-200 rounded-xl"></div>
                            <div>
                              <div className="w-32 h-4 bg-base-200 rounded mb-2"></div>
                              <div className="w-24 h-3 bg-base-300 rounded"></div>
                            </div>
                          </div>
                        </td>
                        <td><div className="w-16 h-6 bg-base-200 rounded"></div></td>
                        <td>
                          <div className="w-20 h-4 bg-base-200 rounded mb-2"></div>
                          <div className="w-16 h-3 bg-base-300 rounded"></div>
                        </td>
                        <td><div className="w-32 h-2 bg-base-200 rounded"></div></td>
                        <td className="text-center"><div className="w-12 h-6 bg-base-200 rounded mx-auto"></div></td>
                        <td><div className="w-24 h-8 bg-base-200 rounded mx-auto"></div></td>
                      </tr>
                    ))
                  ) : filtered.map((c) => {
                    const progress = c.target > 0 ? Math.round((c.collected / c.target) * 100) : 0;
                    return (
                      <tr key={c.id}>
                        <td className="text-base-content/60 font-mono font-medium text-xs">#{c.id}</td>
                        <td>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-base-300 border border-base-200">
                              {(() => {
                                const rawImageUrl = c.imageUrl || c.image;
                                const hasValidImage = rawImageUrl && typeof rawImageUrl === 'string' && rawImageUrl.length > 5 && rawImageUrl !== 'null' && rawImageUrl !== 'undefined';
                                if (hasValidImage) {
                                  return (
                                    <img
                                      src={rawImageUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  );
                                }
                                return null;
                              })()}
                              <div className="w-full h-full flex items-center justify-center text-base-content/40 bg-base-200" style={{ display: (c.imageUrl || c.image) ? 'none' : 'flex' }}>
                                <span className="material-symbols-outlined text-[20px]">image</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-base-content font-bold block mb-0.5 line-clamp-1 max-w-[200px]">{c.title}</span>
                              <span className="text-[11px] text-base-content/60 font-medium">Batas: {c.endDate ? formatDateShort(c.endDate) : 'Tanpa batas'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center w-max gap-1.5 uppercase tracking-wider ${c.category === 'infaq' ? 'bg-primary/10 text-primary border border-primary/20'
                              : c.category === 'wakaf' ? 'bg-secondary/10 text-secondary border border-secondary/20'
                                : 'bg-accent/10 text-accent border border-accent/20'
                            }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {c.category === 'infaq' ? 'volunteer_activism'
                                : c.category === 'wakaf' ? 'real_estate_agent'
                                  : 'loyalty'}
                            </span>
                            {c.category === 'infaq' ? 'Infaq' : c.category === 'wakaf' ? 'Wakaf' : c.category}
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span className="text-primary font-mono font-bold">{formatCurrencyShort(c.collected)}</span>
                            <span className="text-xs text-base-content/60 font-mono mt-0.5">/ {formatCurrencyShort(c.target)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 w-32">
                            <progress className="progress progress-secondary w-full" value={progress} max="100"></progress>
                            <span className="text-[11px] font-mono font-bold w-8 text-right">{progress}%</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className={`px-2.5 py-1 rounded inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border ${c.status === 'active' ? 'bg-success/10 text-success border-success/20' :
                              c.status === 'draft' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-base-200 text-base-content/50 border-base-300'
                            }`}>
                            {c.status === 'active' ? 'Aktif' : c.status === 'draft' ? 'Draft' : 'Selesai'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            <Link to={`/admin-panel/campaigns/${c.id}`} className="btn btn-sm btn-ghost btn-circle text-base-content/60 hover:text-primary transition-colors" title="Ubah Program">
                              <span className="material-symbols-outlined text-[18px]">edit_square</span>
                            </Link>
                            <Link to={`/explore/${c.id}`} target="_blank" className="btn btn-sm btn-ghost btn-circle text-base-content/60 hover:text-secondary transition-colors" title="Lihat Pratinjau User">
                              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                            </Link>
                            <button onClick={() => handleDelete(c.id, c.title)} className="btn btn-sm btn-ghost btn-circle text-base-content/60 hover:text-error transition-colors" title="Hapus Permanen">
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
            <div className="flex items-center justify-between px-6 py-4 bg-base-200/50 text-xs text-base-content/60 font-medium border-t border-base-200">
              <span>Menampilkan total <strong className="text-base-content">{filtered.length}</strong> entri kampanye terdaftar</span>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-base-300/40 backdrop-blur-sm animate-fade-in px-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-base-100 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <h3 className="text-xl font-bold text-base-content">Verifikasi Penghapusan</h3>
            <p className="text-sm text-base-content/70 mt-2 leading-relaxed">
              Apakah Anda benar-benar yakin ingin memusnahkan kampanye <strong className="text-base-content">"{deleteConfirm.name}"</strong>? Data donasi yang terikat mungkin akan menjadi anomali atau tidak dapat diakses lagi. Aksi ini mutlak dan tidak bisa dikembalikan.
            </p>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost">Batalkan</button>
              <button onClick={confirmDelete} className="btn btn-error text-white shadow-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">delete_forever</span> Eksekusi Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
