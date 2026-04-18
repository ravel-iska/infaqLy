import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { formatCurrencyShort, formatCurrency } from '@/utils/formatCurrency';
import { formatTimeAgo } from '@/utils/formatDate';
import { Link } from 'react-router-dom';
import { getAllCampaigns } from '@/services/campaignService';
import api from '@/services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, ResponsiveContainer, PieChart, Pie, Cell, Tooltip as PieTooltip, Legend } from 'recharts';

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [recentTxn, setRecentTxn] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [bugReports, setBugReports] = useState([]);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [campData, txData, chartData] = await Promise.all([
          getAllCampaigns().catch(() => []),
          api.get('/donations?limit=5').catch(() => ({ donations: [] })),
          api.get('/campaigns/monthly-stats').catch(() => ({ months: [] }))
        ]);
        setCampaigns(campData);
        setRecentTxn((txData.donations || []).slice(0, 5));
        setMonthlyStats(chartData.months || []);
        await fetchBugs();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const fetchBugs = async () => {
    try {
      const bugData = await api.get('/bugs');
      setBugReports(bugData);
    } catch {}
  };

  const markBugAsRead = async (id) => {
    try {
      await api.patch(`/bugs/${id}/read`);
      await fetchBugs();
    } catch {
      toast.error('Gagal memperbarui status laporan.');
    }
  };

  const deleteBug = async (id) => {
    if (!confirm('Hapus laporan secara permanen?')) return;
    try {
      await api.delete(`/bugs/${id}`);
      await fetchBugs();
      toast.success('Laporan dihapus.');
    } catch {
      toast.error('Gagal menghapus laporan.');
    }
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalCollected = campaigns.reduce((s, c) => s + c.collected, 0);
  const totalDonors = campaigns.reduce((s, c) => s + c.donors, 0);
  const infaqTotal = campaigns.filter(c => c.category === 'infaq').reduce((s, c) => s + c.collected, 0);
  const wakafTotal = campaigns.filter(c => c.category === 'wakaf').reduce((s, c) => s + c.collected, 0);

  const STATS = [
    { icon: 'monetization_on', label: 'Total Infaq', value: infaqTotal, trend: '+12.5%', up: true, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: 'account_balance', label: 'Total Wakaf', value: wakafTotal, trend: '+8.3%', up: true, color: 'text-secondary', bg: 'bg-secondary/10' },
    { icon: 'schedule', label: 'Program Aktif', value: activeCampaigns.length, trend: `${campaigns.length} total`, up: true, color: 'text-warning', bg: 'bg-warning/10' },
    { icon: 'group', label: 'Donatur', value: totalDonors, trend: '+15%', up: true, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  const pieData = [
    { name: 'Infaq', value: infaqTotal, color: '#10B981' },
    { name: 'Wakaf', value: wakafTotal, color: '#F59E0B' },
  ].filter(d => d.value > 0);
  if (pieData.length === 0) pieData.push({ name: 'Belum Ada', value: 1, color: '#334155' });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-base-content">dashboard</span>
          <h1 className="text-2xl font-bold text-base-content tracking-tight">Dashboard Overview</h1>
        </div>
        <button onClick={() => setIsBugModalOpen(true)} className="btn btn-ghost btn-circle relative hover:bg-base-200 tooltip tooltip-left" data-tip="Laporan Bug / Masukan">
          <span className="material-symbols-outlined text-rose-500 text-[28px]">mark_email_unread</span>
          {bugReports.filter(b => !b.isRead).length > 0 && (
            <span className="absolute top-0 right-0 badge badge-error badge-sm">{bugReports.filter(b => !b.isRead).length}</span>
          )}
        </button>
      </div>

      {/* Stats Grid - Metronic Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {isLoading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="bg-base-100 shadow rounded-2xl p-6 h-[140px] animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-base-200"></div>
                  <div className="w-16 h-6 rounded-md bg-base-200"></div>
                </div>
                <div className="w-24 h-4 rounded bg-base-200 mb-2"></div>
                <div className="w-32 h-8 rounded bg-base-200"></div>
              </div>
            ))
          : STATS.map((stat) => (
              <div key={stat.label} className="bg-base-100 shadow rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <span className={`material-symbols-outlined ${stat.color} text-[24px]`}>{stat.icon}</span>
                  </div>
                  <span className={`text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-md ${stat.up ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {stat.up ? 'trending_up' : 'trending_down'}
                    </span>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-sm font-medium text-base-content/60">{stat.label}</p>
                <p className="text-3xl font-bold text-base-content mt-1 font-headline tracking-tight">
                  {typeof stat.value === 'number' && stat.value > 9999
                    ? formatCurrencyShort(stat.value)
                    : (stat.value || 0).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
      </div>

      {/* Chart + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-base-100 shadow rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary">monitoring</span>
            <h2 className="text-lg font-bold text-base-content">Grafik Donasi Bulanan</h2>
          </div>
          {isLoading ? (
            <div className="h-64 mt-2 bg-base-200/50 rounded-xl animate-pulse"></div>
          ) : monthlyStats.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-base-content/50 bg-base-200/50 rounded-xl border border-base-200">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">bar_chart</span>
              <p className="text-sm font-medium">Belum ada data donasi</p>
            </div>
          ) : (
            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyStats} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818CF8" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickFormatter={(value) => formatCurrencyShort(value)}
                    width={50}
                  />
                  <LineTooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#818CF8', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                    formatter={(value, name, props) => [
                      formatCurrency(value), 
                      `Total (${props.payload.count} transaksi)`
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#818CF8" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                    activeDot={{ r: 6, fill: '#6366F1', stroke: '#1E293B', strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie Chart / Distribusi Kategori */}
        <div className="lg:col-span-2 bg-base-100 shadow rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary">pie_chart</span>
            <h2 className="text-lg font-bold text-base-content">Distribusi Dana</h2>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {isLoading ? (
              <div className="w-48 h-48 rounded-full border-[10px] border-base-200 animate-pulse"></div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <PieTooltip 
                      contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', border: 'none' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      formatter={(value, name) => {
                        if (name === 'Belum Ada') return ['Rp 0', name];
                        return [formatCurrency(value), name];
                      }}
                    />
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1500}
                      animationEasing="ease-out"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span className="text-sm font-semibold text-base-content/80 ml-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Active Campaigns Table + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Active Campaigns Table (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-base-100 shadow rounded-2xl p-0 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">campaign</span>
              <h2 className="text-lg font-bold text-base-content">Daftar Kampanye Aktif</h2>
            </div>
            <Link to="/admin-panel/campaigns/new" className="btn btn-primary btn-sm">
              <span className="material-symbols-outlined text-[18px]">add</span> Buat Baru
            </Link>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="table table-zebra table-md w-full">
              <thead>
                <tr>
                  <th className="bg-base-200">Nama Program</th>
                  <th className="bg-base-200">Target</th>
                  <th className="bg-base-200">Progress</th>
                  <th className="bg-base-200 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={`skel-${i}`} className="animate-pulse">
                      <td><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-base-200"></div><div className="h-4 w-32 bg-base-200 rounded"></div></div></td>
                      <td><div className="h-4 w-16 bg-base-200 rounded"></div></td>
                      <td><div className="h-2 w-24 bg-base-200 rounded"></div></td>
                      <td className="text-center"><div className="h-5 w-12 bg-base-200 rounded mx-auto"></div></td>
                    </tr>
                  ))
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-base-content/50">
                      Tidak ada kampanye aktif. <Link to="/admin-panel/campaigns/new" className="text-primary hover:underline">Buat sekarang</Link>.
                    </td>
                  </tr>
                ) : campaigns.slice(0, 5).map((c) => {
                  const progress = c.target > 0 ? Math.round((c.collected / c.target) * 100) : 0;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-10 rounded-lg bg-base-300">
                              {(c.imageUrl || c.image) ? (
                                <img src={c.imageUrl || c.image} alt="" />
                              ) : (
                                <span className="material-symbols-outlined m-2 text-base-content/50">image</span>
                              )}
                            </div>
                          </div>
                          <span className="font-bold line-clamp-2 max-w-[200px]">{c.title}</span>
                        </div>
                      </td>
                      <td className="font-mono font-medium whitespace-nowrap">
                        {formatCurrencyShort(c.target)}
                      </td>
                      <td>
                        <div className="flex items-center gap-2 w-32">
                          <progress className="progress progress-secondary w-full" value={progress} max="100"></progress>
                          <span className="text-xs font-mono font-bold w-8 text-right">{progress}%</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className={`badge badge-sm badge-outline gap-1 ${
                          c.status === 'active' ? 'badge-success' :
                          c.status === 'draft' ? 'badge-warning' : ''
                        }`}>
                           {c.status === 'active' ? 'Aktif' : c.status === 'draft' ? 'Draft' : 'Selesai'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions (lg:col-span-2) */}
        <div className="lg:col-span-2 bg-base-100 shadow rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-warning">bolt</span>
            <h2 className="text-lg font-bold text-base-content">Transaksi Terkini</h2>
          </div>
          <div className="space-y-4 flex-1">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={`tx-skel-${i}`} className="flex items-center justify-between p-4 rounded-xl bg-base-200/50 animate-pulse">
                  <div>
                    <div className="h-4 w-24 bg-base-300 rounded mb-1"></div>
                    <div className="h-3 w-32 bg-base-200 rounded"></div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="h-4 w-20 bg-base-300 rounded mb-1"></div>
                    <div className="h-5 w-16 bg-base-200 rounded-full"></div>
                  </div>
                </div>
              ))
            ) : recentTxn.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-base-content/50">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
                <p className="text-sm font-medium">Belum ada transaksi</p>
              </div>
            ) : recentTxn.map((tx) => (
              <div key={tx.orderId} className="flex items-center justify-between p-4 rounded-xl bg-base-200/50 hover:bg-base-200 transition-colors">
                <div>
                  <p className="text-sm font-bold text-base-content">{tx.donorName}</p>
                  <p className="text-xs text-base-content/60 font-mono mt-0.5">{tx.orderId} · {formatTimeAgo(tx.createdAt)}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-sm font-bold text-base-content font-mono tracking-tight mb-1">{formatCurrency(tx.amount)}</p>
                  <div className={`badge badge-sm badge-outline ${
                    tx.paymentStatus === 'success' ? 'badge-success' :
                    tx.paymentStatus === 'pending' ? 'badge-warning' : 'badge-error'
                  }`}>
                    {tx.paymentStatus}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/admin-panel/transactions" className="btn btn-outline btn-block mt-4">
            Lihat Semua <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
          </Link>
        </div>

      </div>

      {isBugModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-base-300/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-base-100 w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-5 border-b border-base-200 flex justify-between items-center bg-base-100">
              <h3 className="font-bold text-lg flex items-center gap-2"><span className="material-symbols-outlined text-rose-500">bug_report</span> Kotak Masuk Dukungan (Bug Report)</h3>
              <button onClick={() => setIsBugModalOpen(false)} className="btn btn-ghost btn-xs btn-circle"><span className="material-symbols-outlined text-base-content/50 text-[20px]">close</span></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 bg-base-200/30 flex-1">
              {bugReports.length === 0 ? (
                <p className="text-center py-10 opacity-50 font-medium">Belum ada laporan masuk.</p>
              ) : (
                bugReports.map(r => (
                  <div key={r.id} className={`p-5 rounded-xl border ${r.isRead ? 'bg-base-100 border-base-200 opacity-70' : 'bg-base-100 border-rose-200 shadow-sm'}`}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-base-content flex items-center gap-2">
                          {r.userName} 
                          <a href={`mailto:${r.userEmail}`} className="font-normal opacity-60 hover:text-primary transition-colors hover:underline">({r.userEmail})</a>
                          {!r.isRead && <span className="badge badge-error badge-xs">Baru</span>}
                        </h4>
                        <p className="text-[11px] opacity-60 font-mono mt-1 flex items-center gap-1.5"><span className="material-symbols-outlined text-[12px]">link</span> {r.path} &bull; {formatTimeAgo(r.createdAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        {!r.isRead && (
                          <button onClick={() => markBugAsRead(r.id)} className="btn btn-xs btn-success btn-outline gap-1 leading-none"><span className="material-symbols-outlined text-[14px]">done_all</span> Tandai Dibaca</button>
                        )}
                        <button onClick={() => deleteBug(r.id)} className="btn btn-xs btn-error btn-outline"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                      </div>
                    </div>
                    <div className="bg-base-200/50 p-3.5 rounded-lg text-sm text-base-content/80 whitespace-pre-wrap font-medium">
                      {r.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
