import { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateTime } from '@/utils/formatDate';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, itemsPerPage]);

  // Sandbox Modal State
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxOrderId, setSandboxOrderId] = useState('');
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [midtransEnv, setMidtransEnv] = useState('production'); // default safe lock

  // Load from database
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const dataRes = await api.get(`/donations?t=${Date.now()}`);
      setTransactions(dataRes.donations || []);
    } catch (err) {
      console.error('[TransactionsPage] Load error:', err);
      toast.error(err.message || 'Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }

    // Fetch Midtrans env separately so it never blocks transactions
    try {
      const configRes = await api.get(`/midtrans/client-config?t=${Date.now()}`);
      console.log('[TransactionsPage] configRes:', configRes);
      setMidtransEnv(configRes.env || 'production');
    } catch (err) {
      console.error('[TransactionsPage] Config error:', err);
      setMidtransEnv('production'); // safe fallback
    }
  };

  const handleSandboxSimulate = async (e) => {
    e.preventDefault();
    if (!sandboxOrderId.trim()) return toast.error('Masukkan Order ID!');
    setSandboxLoading(true);
    try {
      await api.post(`/midtrans/simulate-success/${sandboxOrderId.trim()}`);
      toast.success('Simulasi Pembayaran Berhasil!');
      setSandboxOrderId('');
      setShowSandbox(false);
      loadTransactions();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Gagal simulasi pembayaran');
    } finally {
      setSandboxLoading(false);
    }
  };

  useEffect(() => { loadTransactions(); }, []);

  const filtered = transactions.filter(tx => {
    if (statusFilter !== 'all' && tx.paymentStatus !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!tx.orderId?.toLowerCase().includes(q) && !tx.donorName?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const total = filtered.reduce((s, t) => s + (t.amount || 0), 0);
  const successCount = filtered.filter(t => t.paymentStatus === 'success').length;
  const pendingCount = filtered.filter(t => t.paymentStatus === 'pending').length;
  const expiredCount = filtered.filter(t => t.paymentStatus === 'expired' || t.paymentStatus === 'failed').length;

  // Pagination Logic
  const startIndex = (currentPage - 1) * (itemsPerPage === 'all' ? filtered.length : Number(itemsPerPage));
  const paginatedTransactions = itemsPerPage === 'all' 
    ? filtered 
    : filtered.slice(startIndex, startIndex + Number(itemsPerPage));
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filtered.length / Number(itemsPerPage));

  const exportCSV = async () => {
    try {
      const res = await fetch('/api/donations/export', {
        headers: { Authorization: `Bearer ${localStorage.getItem('infaqly_admin_token')}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transaksi-infaqly-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('File CSV berhasil diunduh!');
    } catch {
      toast.error('Gagal export CSV');
    }
  };

  const statusLabel = (s) => {
    if (s === 'success') return 'Berhasil';
    if (s === 'pending') return 'Menunggu';
    if (s === 'expired') return 'Kedaluwarsa';
    if (s === 'failed') return 'Gagal';
    return s;
  };

  const statusBadge = (s) => {
    if (s === 'success') return 'bg-success/10 text-success border border-success/20';
    if (s === 'pending') return 'bg-warning/10 text-warning border border-warning/20';
    return 'bg-danger/10 text-danger border border-danger/20';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-base-content">receipt_long</span>
          <h1 className="text-2xl font-bold text-base-content tracking-tight">Log Transaksi</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={loadTransactions} className="btn btn-outline" disabled={loading}>
            <span className={`material-symbols-outlined text-[18px] mr-1 ${loading ? 'animate-spin' : ''}`}>sync</span> Refresh
          </button>
          <button onClick={exportCSV} className="btn btn-primary">
            <span className="material-symbols-outlined text-[18px] mr-1">download</span> Export CSV
          </button>
          {midtransEnv === 'sandbox' && (
            <button onClick={() => setShowSandbox(true)} className="btn btn-ghost font-mono tracking-tight" title="Developer Sandbox Mode">
              <span className="material-symbols-outlined text-[18px] mr-1">bug_report</span> Sandbox
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-base-100 p-4 rounded-2xl border border-base-200">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-base-content/50 text-[20px]">search</span>
          <input
            type="text"
            placeholder="Cari Order ID atau nama donatur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full pl-12 font-medium"
          />
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-base-content/50 text-[20px]">filter_list</span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="select select-bordered pl-12 sm:w-56 font-medium"
          >
            <option value="all">Semua Status (All)</option>
            <option value="success">Berhasil (Success)</option>
            <option value="pending">Menunggu (Pending)</option>
            <option value="expired">Kedaluwarsa (Expired)</option>
            <option value="failed">Gagal (Failed)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-base-100 shadow rounded-2xl overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-md w-full">
              <thead>
                <tr>
                  <th className="bg-base-200">Order ID</th>
                  <th className="bg-base-200">Donatur</th>
                  <th className="bg-base-200">Nominal</th>
                  <th className="bg-base-200">Metode</th>
                  <th className="bg-base-200 text-center">Status</th>
                  <th className="bg-base-200 text-left">Tanggal Waktu</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                    <td><div className="h-4 w-24 bg-base-200 rounded"></div></td>
                    <td><div className="h-4 w-32 bg-base-200 rounded"></div></td>
                    <td><div className="h-4 w-20 bg-base-200 rounded"></div></td>
                    <td><div className="h-6 w-24 bg-base-200 rounded"></div></td>
                    <td><div className="h-6 w-24 bg-base-200 rounded mx-auto"></div></td>
                    <td><div className="h-4 w-32 bg-base-200 rounded"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-base-content/50 flex flex-col items-center">
            <span className="material-symbols-outlined text-6xl opacity-30 mb-4">receipt_long</span>
            <p className="text-lg font-bold text-base-content">Belum ada transaksi</p>
            <p className="text-sm mt-1">Tidak ada data untuk ditampilkan pada filter ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-md w-full">
              <thead>
                <tr>
                  <th className="bg-base-200">Order ID</th>
                  <th className="bg-base-200">Donatur</th>
                  <th className="bg-base-200">Nominal</th>
                  <th className="bg-base-200">Metode</th>
                  <th className="bg-base-200 text-center">Status</th>
                  <th className="bg-base-200 text-left">Tanggal Waktu</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx) => {
                  // Hitung sisa waktu sebelum auto-expire via Midtrans (24 jam)
                  const createdMs = new Date(tx.createdAt).getTime();
                  const expireMs = createdMs + 24 * 60 * 60 * 1000;
                  const remainMs = expireMs - Date.now();
                  const remainHours = Math.max(0, Math.floor(remainMs / (60 * 60 * 1000)));
                  const remainMins = Math.max(0, Math.floor((remainMs % (60 * 60 * 1000)) / (60 * 1000)));
                  const isOverdue = remainMs <= 0;

                  return (
                    <tr key={tx.id || tx.orderId}>
                      <td className="text-primary font-mono text-xs font-bold tracking-wider">{tx.orderId}</td>
                      <td className="font-bold">{tx.donorName}</td>
                      <td className="font-mono font-bold tracking-tight">{formatCurrency(tx.amount)}</td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-base-200 rounded text-xs border border-base-300 font-medium">
                          <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                          {tx.paymentMethod || '-'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`badge badge-sm badge-outline gap-1 p-3 ${
                            tx.paymentStatus === 'success' ? 'badge-success' :
                            tx.paymentStatus === 'pending' ? 'badge-warning' : 'badge-error'
                          }`}>
                            {tx.paymentStatus === 'success' ? <span className="material-symbols-outlined text-[12px]">check_circle</span> :
                             tx.paymentStatus === 'pending' ? <span className="material-symbols-outlined text-[12px]">schedule</span> :
                             <span className="material-symbols-outlined text-[12px]">cancel</span>}
                            {statusLabel(tx.paymentStatus)}
                          </span>
                          {tx.paymentStatus === 'pending' && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${isOverdue ? 'bg-error/10 text-error' : 'bg-base-200 text-base-content/60 border border-base-300'}`}>
                              {isOverdue ? '! Menunggu Webhook API' : `Auto-expire: ${remainHours}j ${remainMins}m`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-base-content/60 font-mono text-xs">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-base-200 bg-base-100 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-base-content/70">Tampilkan:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(e.target.value)}
                className="select select-bordered select-sm w-24 font-mono text-sm shadow-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value="all">Semua</option>
              </select>
            </div>
            
            {itemsPerPage !== 'all' && totalPages > 1 && (
              <div className="join shadow-sm">
                <button 
                  className="join-item btn btn-sm btn-outline hover:bg-base-200 hover:text-base-content" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span> Prev
                </button>
                <span className="join-item btn btn-sm btn-disabled bg-base-200/50 text-base-content font-medium">Halaman {currentPage} dari {totalPages}</span>
                <button 
                  className="join-item btn btn-sm btn-outline hover:bg-base-200 hover:text-base-content" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Summary bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-base-200 bg-base-200/50 text-sm">
          <span className="text-base-content/60 font-medium">Total Perputaran: <strong className="text-base-content font-mono tracking-tight ml-1">{formatCurrency(total)}</strong> ({filtered.length} transaksi)</span>
          <div className="flex gap-4 text-xs font-bold font-mono bg-base-100 px-4 py-2 rounded-lg border border-base-200 mt-3 sm:mt-0 shadow-sm">
            <span className="text-success flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> {successCount}</span>
            <span className="text-warning flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {pendingCount}</span>
            <span className="text-error flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">cancel</span> {expiredCount}</span>
          </div>
        </div>
      </div>

      {/* Sandbox Simulator Modal */}
      {showSandbox && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-base-100 border border-base-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-base-200 flex justify-between items-center bg-base-200/50">
              <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bug_report</span>
                Developer Sandbox
              </h3>
              <button onClick={() => setShowSandbox(false)} className="text-base-content/50 hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSandboxSimulate} className="p-6">
              <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl mb-6 flex items-start gap-3">
                <span className="material-symbols-outlined text-warning shrink-0 mt-0.5">warning</span>
                <p className="text-sm text-base-content/80 leading-relaxed">
                  <strong className="text-base-content block mb-1">Peringatan Mode Dev:</strong>
                  Ini melompati Midtrans sepenuhnya dan akan mengubah database langsung menjadi "Success".
                </p>
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-sm font-bold text-base-content">Order ID Target</label>
                <input
                  type="text"
                  placeholder="Misal: INF-XXXXXX"
                  value={sandboxOrderId}
                  onChange={(e) => setSandboxOrderId(e.target.value)}
                  className="input input-bordered w-full font-mono font-bold tracking-wider text-primary"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowSandbox(false)} className="btn btn-ghost border border-base-300">
                  Batal
                </button>
                <button type="submit" disabled={sandboxLoading} className="btn btn-primary">
                  {sandboxLoading ? <span className="loading loading-spinner"></span> : 'Paksa Sukses Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
