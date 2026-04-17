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

  // Sandbox Modal State
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxOrderId, setSandboxOrderId] = useState('');
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [midtransEnv, setMidtransEnv] = useState('production'); // default safe lock

  // Load from database
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const [dataRes, configRes] = await Promise.all([
        api.get('/donations'),
        api.get('/payment/client-config')
      ]);
      setTransactions(dataRes.data?.donations || dataRes.donations || []);
      setMidtransEnv(configRes.data?.env || configRes.env || 'production');
    } catch (err) {
      console.error('[TransactionsPage] Load error:', err);
      toast.error(err.message || 'Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxSimulate = async (e) => {
    e.preventDefault();
    if (!sandboxOrderId.trim()) return toast.error('Masukkan Order ID!');
    setSandboxLoading(true);
    try {
      await api.post(`/payment/simulate-success/${sandboxOrderId.trim()}`);
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
    <div className="animate-fade-in space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-admin-text">receipt_long</span>
          <h1 className="text-2xl font-bold text-admin-text tracking-tight">Log Transaksi</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={loadTransactions} className="btn-admin-ghost flex items-center justify-center gap-1.5 px-4 bg-admin-bg hover:bg-admin-bg-hover text-admin-text-secondary hover:text-admin-text border border-admin-border" disabled={loading}>
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span> Refresh
          </button>
          <button onClick={exportCSV} className="btn-admin-primary flex items-center justify-center gap-1.5 px-6">
            <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
          </button>
          {midtransEnv === 'sandbox' && (
            <button onClick={() => setShowSandbox(true)} className="btn-admin-ghost flex items-center justify-center gap-1.5 px-4 bg-admin-bg border border-admin-border hover:border-admin-accent hover:text-admin-accent transition-colors font-mono tracking-tight" title="Developer Sandbox Mode">
              <span className="material-symbols-outlined text-[18px]">bug_report</span> Sandbox
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-admin-bg-sidebar p-4 rounded-2xl border border-admin-border">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-[20px]">search</span>
          <input
            type="text"
            placeholder="Cari Order ID atau nama donatur..."
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
            className="input-admin pl-12 sm:w-56 font-medium appearance-none"
          >
            <option value="all">Semua Status (All)</option>
            <option value="success">✅ Berhasil (Success)</option>
            <option value="pending">⏳ Menunggu (Pending)</option>
            <option value="expired">❌ Kedaluwarsa (Expired)</option>
            <option value="failed">❌ Gagal (Failed)</option>
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted pointer-events-none text-[20px]">expand_more</span>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-admin-text-muted flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl animate-spin mb-4 text-admin-accent">sync</span>
            <p className="text-lg font-bold text-admin-text">Memuat transaksi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-admin-text-muted flex flex-col items-center">
            <span className="material-symbols-outlined text-6xl opacity-30 mb-4">receipt_long</span>
            <p className="text-lg font-bold text-admin-text">Belum ada transaksi</p>
            <p className="text-sm mt-1">Tidak ada data untuk ditampilkan pada filter ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border bg-admin-bg-sidebar">
                  <th className="text-left px-6 py-4 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Order ID</th>
                  <th className="text-left px-6 py-4 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Donatur</th>
                  <th className="text-left px-6 py-4 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Nominal</th>
                  <th className="text-left px-6 py-4 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Metode</th>
                  <th className="text-center px-6 py-4 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Status</th>
                  <th className="text-left px-6 py-4 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Tanggal Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filtered.map((tx) => {
                  // Hitung sisa waktu sebelum auto-expire via Midtrans (24 jam)
                  const createdMs = new Date(tx.createdAt).getTime();
                  const expireMs = createdMs + 24 * 60 * 60 * 1000;
                  const remainMs = expireMs - Date.now();
                  const remainHours = Math.max(0, Math.floor(remainMs / (60 * 60 * 1000)));
                  const remainMins = Math.max(0, Math.floor((remainMs % (60 * 60 * 1000)) / (60 * 1000)));
                  const isOverdue = remainMs <= 0;

                  return (
                    <tr key={tx.id || tx.orderId} className="hover:bg-admin-bg-hover transition-colors">
                      <td className="px-6 py-4 text-admin-accent font-mono text-xs font-bold tracking-wider">{tx.orderId}</td>
                      <td className="px-6 py-4 text-admin-text font-bold">{tx.donorName}</td>
                      <td className="px-6 py-4 text-admin-text font-mono font-bold tracking-tight">{formatCurrency(tx.amount)}</td>
                      <td className="px-6 py-4 text-admin-text-secondary">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-admin-bg rounded text-xs border border-admin-border font-medium">
                          <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                          {tx.paymentMethod || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded inline-flex items-center gap-1.5 ${statusBadge(tx.paymentStatus)}`}>
                            {tx.paymentStatus === 'success' ? <span className="material-symbols-outlined text-[12px]">check_circle</span> :
                             tx.paymentStatus === 'pending' ? <span className="material-symbols-outlined text-[12px]">schedule</span> :
                             <span className="material-symbols-outlined text-[12px]">cancel</span>}
                            {statusLabel(tx.paymentStatus)}
                          </span>
                          {tx.paymentStatus === 'pending' && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${isOverdue ? 'bg-danger/10 text-danger' : 'bg-admin-bg-sidebar text-admin-text-muted border border-admin-border'}`}>
                              {isOverdue ? '⚠️ Menunggu Webhook API' : `⏱️ Auto-expire: ${remainHours}j ${remainMins}m`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-admin-text-muted font-mono text-xs">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Summary bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-admin-border bg-admin-bg text-sm">
          <span className="text-admin-text-muted font-medium">Total Perputaran: <strong className="text-admin-text font-mono tracking-tight ml-1">{formatCurrency(total)}</strong> ({filtered.length} transaksi)</span>
          <div className="flex gap-4 text-xs font-bold font-mono bg-admin-bg-sidebar px-4 py-2 rounded-lg border border-admin-border mt-3 sm:mt-0">
            <span className="text-success flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> {successCount}</span>
            <span className="text-warning flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {pendingCount}</span>
            <span className="text-danger flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">cancel</span> {expiredCount}</span>
          </div>
        </div>
      </div>

      {/* Sandbox Simulator Modal */}
      {showSandbox && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-admin-bg border border-admin-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-admin-border flex justify-between items-center bg-admin-bg-sidebar">
              <h3 className="text-lg font-bold text-admin-text flex items-center gap-2">
                <span className="material-symbols-outlined text-admin-accent">bug_report</span>
                Developer Sandbox
              </h3>
              <button onClick={() => setShowSandbox(false)} className="text-admin-text-muted hover:text-danger transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSandboxSimulate} className="p-6">
              <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl mb-6 flex items-start gap-3">
                <span className="material-symbols-outlined text-warning shrink-0 mt-0.5">warning</span>
                <p className="text-sm text-admin-text-secondary leading-relaxed">
                  <strong className="text-admin-text block mb-1">Peringatan Mode Dev:</strong>
                  Ini melompati Midtrans sepenuhnya dan akan mengubah database langsung menjadi "Success". Uang tidak benar-benar ditarik dari rekening manapun.
                </p>
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-sm font-bold text-admin-text">Order ID Target</label>
                <input
                  type="text"
                  placeholder="Misal: INF-XXXXXX"
                  value={sandboxOrderId}
                  onChange={(e) => setSandboxOrderId(e.target.value)}
                  className="input-admin w-full font-mono font-bold tracking-wider text-admin-accent bg-admin-bg-sidebar"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowSandbox(false)} className="btn-admin-ghost border border-admin-border">
                  Batal
                </button>
                <button type="submit" disabled={sandboxLoading} className="btn-admin-primary">
                  {sandboxLoading ? 'Menyimulasikan...' : 'Paksa Sukses Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
