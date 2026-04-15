import { useState, useEffect } from 'react';
import { Download, Search, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateTime } from '@/utils/formatDate';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Load from database
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.get('/donations');
      setTransactions(data.donations || []);
    } catch (err) {
      console.error('[TransactionsPage] Load error:', err);
      toast.error(err.message || 'Gagal memuat transaksi');
    } finally {
      setLoading(false);
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
      toast.success('File CSV berhasil diunduh! 📥');
    } catch {
      toast.error('Gagal export CSV');
    }
  };

  const statusLabel = (s) => {
    if (s === 'success') return '✅ Berhasil';
    if (s === 'pending') return '⏳ Menunggu';
    if (s === 'expired') return '❌ Kedaluwarsa';
    if (s === 'failed') return '❌ Gagal';
    return s;
  };

  const statusBadge = (s) => {
    if (s === 'success') return 'badge-admin-success';
    if (s === 'pending') return 'badge-admin-warning';
    return 'badge-admin-danger';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-admin-text">💳 Log Transaksi</h1>
        <div className="flex flex-wrap gap-2">

          <button onClick={loadTransactions} className="btn-admin-ghost text-sm flex-1 sm:flex-none justify-center" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportCSV} className="btn-admin-ghost text-sm flex-1 sm:flex-none justify-center">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
          <input
            type="text"
            placeholder="Cari order ID atau donatur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-admin pl-10 !font-sans"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-admin !w-auto min-w-[140px] !font-sans">
          <option value="all">Semua Status</option>
          <option value="success">Berhasil</option>
          <option value="pending">Menunggu</option>
          <option value="expired">Kedaluwarsa</option>
          <option value="failed">Gagal</option>
        </select>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-admin-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
            <p>Memuat transaksi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-admin-text-muted">
            <p className="text-4xl mb-2">📭</p>
            <p>Belum ada transaksi {statusFilter !== 'all' ? `dengan status "${statusFilter}"` : ''}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border bg-admin-bg-sidebar">
                  <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Order ID</th>
                  <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Donatur</th>
                  <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Nominal</th>
                  <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Metode</th>
                  <th className="text-center px-5 py-3 text-admin-text-secondary font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Tanggal & Jam</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  // Hitung sisa waktu sebelum auto-expire via Midtrans (24 jam)
                  const createdMs = new Date(tx.createdAt).getTime();
                  const expireMs = createdMs + 24 * 60 * 60 * 1000;
                  const remainMs = expireMs - Date.now();
                  const remainHours = Math.max(0, Math.floor(remainMs / (60 * 60 * 1000)));
                  const remainMins = Math.max(0, Math.floor((remainMs % (60 * 60 * 1000)) / (60 * 1000)));
                  const isOverdue = remainMs <= 0;

                  return (
                    <tr key={tx.id || tx.orderId} className="border-b border-admin-border last:border-0 hover:bg-admin-bg-hover transition-colors">
                      <td className="px-5 py-4 text-admin-accent font-mono text-xs">{tx.orderId}</td>
                      <td className="px-5 py-4 text-admin-text">{tx.donorName}</td>
                      <td className="px-5 py-4 text-admin-text font-mono font-semibold">{formatCurrency(tx.amount)}</td>
                      <td className="px-5 py-4 text-admin-text-secondary">{tx.paymentMethod || '-'}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={statusBadge(tx.paymentStatus)}>
                          {statusLabel(tx.paymentStatus)}
                        </span>
                        {tx.paymentStatus === 'pending' && (
                          <p className={`text-[10px] mt-1 ${isOverdue ? 'text-danger' : 'text-admin-text-muted'}`}>
                            {isOverdue ? '⚠️ Menunggu webhook Midtrans' : `⏱️ Auto-expire: ${remainHours}j ${remainMins}m`}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-admin-text-muted font-mono text-xs">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Summary bar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-admin-border text-sm">
          <span className="text-admin-text-muted">Total: <span className="text-admin-text font-mono font-semibold">{formatCurrency(total)}</span> ({filtered.length} transaksi)</span>
          <div className="flex gap-4 text-xs">
            <span className="text-success">✅ {successCount}</span>
            <span className="text-warning">⏳ {pendingCount}</span>
            <span className="text-danger">❌ {expiredCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
