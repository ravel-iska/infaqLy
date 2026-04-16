import { useState, useEffect } from 'react';
import { formatCurrencyShort, formatCurrency } from '@/utils/formatCurrency';
import { formatTimeAgo } from '@/utils/formatDate';
import { Link } from 'react-router-dom';
import { getAllCampaigns } from '@/services/campaignService';
import api from '@/services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [recentTxn, setRecentTxn] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllCampaigns();
        setCampaigns(data);
      } catch {}
      try {
        const txData = await api.get('/donations?limit=5');
        setRecentTxn((txData.donations || []).slice(0, 5));
      } catch {}
      try {
        const chartData = await api.get('/campaigns/monthly-stats');
        setMonthlyStats(chartData.months || []);
      } catch {}
    })();
  }, []);

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalCollected = campaigns.reduce((s, c) => s + c.collected, 0);
  const totalDonors = campaigns.reduce((s, c) => s + c.donors, 0);
  const infaqTotal = campaigns.filter(c => c.category === 'infaq').reduce((s, c) => s + c.collected, 0);
  const wakafTotal = campaigns.filter(c => c.category === 'wakaf').reduce((s, c) => s + c.collected, 0);

  const STATS = [
    { icon: 'monetization_on', label: 'Total Infaq', value: infaqTotal, trend: '+12.5%', up: true, color: 'text-admin-accent', bg: 'bg-admin-accent/10' },
    { icon: 'account_balance', label: 'Total Wakaf', value: wakafTotal, trend: '+8.3%', up: true, color: 'text-admin-accent-secondary', bg: 'bg-admin-accent-secondary/10' },
    { icon: 'schedule', label: 'Program Aktif', value: activeCampaigns.length, trend: `${campaigns.length} total`, up: true, color: 'text-warning', bg: 'bg-warning/10' },
    { icon: 'group', label: 'Donatur', value: totalDonors, trend: '+15%', up: true, color: 'text-admin-accent', bg: 'bg-admin-accent/10' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-[28px] text-admin-text">dashboard</span>
        <h1 className="text-2xl font-bold text-admin-text tracking-tight">Dashboard Overview</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="admin-card p-5 border border-admin-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <span className={`material-symbols-outlined ${stat.color} text-[22px]`}>{stat.icon}</span>
              </div>
              <span className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded bg-admin-bg/50 ${stat.up ? 'text-success' : 'text-danger'}`}>
                <span className="material-symbols-outlined text-[14px]">
                  {stat.up ? 'trending_up' : 'trending_down'}
                </span>
                {stat.trend}
              </span>
            </div>
            <p className="text-sm font-semibold text-admin-text-secondary">{stat.label}</p>
            <p className="text-2xl font-bold text-admin-text mt-1 font-mono tracking-tight">
              {typeof stat.value === 'number' && stat.value > 9999
                ? formatCurrencyShort(stat.value)
                : (stat.value || 0).toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </div>

      {/* Chart + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 admin-card p-6 border border-admin-border">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-admin-accent">monitoring</span>
            <h2 className="text-lg font-bold text-admin-text">Grafik Donasi Bulanan</h2>
          </div>
          {monthlyStats.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-admin-text-muted bg-admin-bg-sidebar/50 rounded-xl border border-admin-border/50">
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
                  <Tooltip 
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

        <div className="lg:col-span-2 admin-card p-6 border border-admin-border flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-warning">bolt</span>
            <h2 className="text-lg font-bold text-admin-text">Transaksi Terkini</h2>
          </div>
          <div className="space-y-4 flex-1">
            {recentTxn.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-admin-text-muted">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
                <p className="text-sm font-medium">Belum ada transaksi</p>
              </div>
            ) : recentTxn.map((tx) => (
              <div key={tx.orderId} className="flex items-center justify-between p-3 rounded-xl bg-admin-bg-sidebar border border-admin-border/50 hover:border-admin-border transition-colors">
                <div>
                  <p className="text-sm font-bold text-admin-text">{tx.donorName}</p>
                  <p className="text-xs text-admin-text-muted font-mono mt-0.5">{tx.orderId} · {formatTimeAgo(tx.createdAt)}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-sm font-bold text-admin-text font-mono tracking-tight mb-1">{formatCurrency(tx.amount)}</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    tx.paymentStatus === 'success' ? 'bg-success/10 text-success border border-success/20' :
                    tx.paymentStatus === 'pending' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-danger/10 text-danger border border-danger/20'
                  }`}>
                    {tx.paymentStatus === 'success' ? <span className="material-symbols-outlined text-[12px]">check_circle</span> : 
                     tx.paymentStatus === 'pending' ? <span className="material-symbols-outlined text-[12px]">schedule</span> : 
                     <span className="material-symbols-outlined text-[12px]">cancel</span>}
                    {tx.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/admin-panel/transactions" className="mt-6 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-admin-bg hover:bg-admin-bg-hover text-sm font-bold text-admin-text-secondary hover:text-admin-text transition-colors border border-admin-border">
            Lihat Semua <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Active Campaigns Table */}
      <div className="admin-card p-6 border border-admin-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-admin-accent-secondary">campaign</span>
            <h2 className="text-lg font-bold text-admin-text">Daftar Kampanye Aktif</h2>
          </div>
          <Link to="/admin-panel/campaigns/new" className="btn-admin-primary !py-2 !px-4 text-sm flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">add</span> Buat Baru
          </Link>
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-admin-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-admin-bg-sidebar">
                <th className="text-left px-5 py-3.5 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Nama Program</th>
                <th className="text-left px-5 py-3.5 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Target</th>
                <th className="text-left px-5 py-3.5 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Progress</th>
                <th className="text-center px-5 py-3.5 text-admin-text-secondary font-semibold text-xs tracking-wider uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-admin-text-muted">
                    Tidak ada kampanye aktif. <Link to="/admin-panel/campaigns/new" className="text-admin-accent hover:underline">Buat sekarang</Link>.
                  </td>
                </tr>
              ) : campaigns.slice(0, 5).map((c) => {
                const progress = c.target > 0 ? Math.round((c.collected / c.target) * 100) : 0;
                return (
                  <tr key={c.id} className="hover:bg-admin-bg-hover transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-admin-bg">
                          {(c.imageUrl || c.image) ? (
                            <img src={c.imageUrl || c.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-admin-text-muted bg-admin-bg-sidebar">
                              <span className="material-symbols-outlined">image</span>
                            </div>
                          )}
                        </div>
                        <span className="text-admin-text font-bold line-clamp-2">{c.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-admin-text font-mono font-medium tracking-tight whitespace-nowrap">
                      {formatCurrencyShort(c.target)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <div className="flex-1 h-2 rounded-full bg-admin-bg overflow-hidden border border-admin-border/50">
                          <div className="h-full rounded-full bg-admin-accent-secondary" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        </div>
                        <span className="text-xs text-admin-text font-mono font-bold w-10 text-right">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                        c.status === 'active' ? 'bg-success/10 text-success border border-success/20' :
                        c.status === 'draft' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-admin-bg text-admin-text-muted border border-admin-border'
                      }`}>
                        <span className={`w-1.5 h-1.5 justify-center rounded-full ${c.status === 'active' ? 'bg-success' : c.status === 'draft' ? 'bg-warning' : 'bg-admin-text-muted'}`}></span>
                        {c.status === 'active' ? 'Aktif' : c.status === 'draft' ? 'Draft' : 'Selesai'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
