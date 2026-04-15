import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, ExternalLink } from 'lucide-react';
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
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-admin-text">📋 Manajemen Kampanye</h1>
        <Link to="/admin-panel/campaigns/new" className="btn-admin-primary text-sm">
          <Plus size={18} /> Buat Baru
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
          <input
            type="text"
            placeholder="Cari kampanye..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-admin pl-10 !font-sans"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-admin !w-auto min-w-[160px] !font-sans"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="draft">Draft</option>
          <option value="closed">Selesai</option>
        </select>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-admin-text-muted">
            <p className="text-lg">Tidak ada kampanye ditemukan</p>
            <p className="text-sm mt-1">Coba ubah filter atau buat kampanye baru</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-admin-border bg-admin-bg-sidebar">
                    <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">#</th>
                    <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Kampanye</th>
                    <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Kategori</th>
                    <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Target</th>
                    <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Terkumpul</th>
                    <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Progress</th>
                    <th className="text-center px-5 py-3 text-admin-text-secondary font-medium">Status</th>
                    <th className="text-center px-5 py-3 text-admin-text-secondary font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const progress = c.target > 0 ? Math.round((c.collected / c.target) * 100) : 0;
                    return (
                      <tr key={c.id} className="border-b border-admin-border last:border-0 hover:bg-admin-bg-hover transition-colors">
                        <td className="px-5 py-4 text-admin-text-muted font-mono text-xs">#{c.id}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {(c.imageUrl || c.image) && (
                              <img src={c.imageUrl || c.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <span className="text-admin-text font-medium">{c.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${c.category === 'infaq' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {c.category === 'infaq' ? 'Infaq' : 'Wakaf'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-admin-text font-mono">{formatCurrencyShort(c.target)}</td>
                        <td className="px-5 py-4 text-admin-accent-secondary font-mono">{formatCurrencyShort(c.collected)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-admin-bg-hover overflow-hidden min-w-[60px]">
                              <div className="h-full rounded-full bg-admin-accent-secondary" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                            </div>
                            <span className="text-xs text-admin-text-muted font-mono">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={
                            c.status === 'active' ? 'badge-admin-success' :
                            c.status === 'draft' ? 'badge-admin-warning' : 'badge-admin-danger'
                          }>
                            {c.status === 'active' ? '🟢 Aktif' : c.status === 'draft' ? '🟡 Draft' : '🔴 Selesai'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link to={`/admin-panel/campaigns/${c.id}`} className="p-1.5 rounded hover:bg-admin-bg-hover text-admin-text-secondary hover:text-admin-accent transition-colors" title="Edit">
                              <Edit size={16} />
                            </Link>
                            <button onClick={() => handleDelete(c.id, c.title)} className="p-1.5 rounded hover:bg-admin-bg-hover text-admin-text-secondary hover:text-danger transition-colors" title="Hapus">
                              <Trash2 size={16} />
                            </button>
                            <Link to={`/explore/${c.id}`} target="_blank" className="p-1.5 rounded hover:bg-admin-bg-hover text-admin-text-secondary hover:text-admin-text transition-colors" title="Lihat di User">
                              <ExternalLink size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-admin-border text-sm text-admin-text-muted">
              <span>Menampilkan {filtered.length} dari {campaigns.length} kampanye</span>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-admin-bg-card border border-admin-border rounded-admin p-6 w-full max-w-md mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-admin-text">⚠️ Konfirmasi Hapus</h3>
            <p className="text-sm text-admin-text-secondary mt-2">
              Apakah Anda yakin ingin menghapus kampanye <strong className="text-admin-text">"{deleteConfirm.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDeleteConfirm(null)} className="btn-admin-ghost text-sm">Batal</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-danger text-white text-sm font-medium rounded-admin hover:bg-red-600 transition-colors">
                🗑 Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
