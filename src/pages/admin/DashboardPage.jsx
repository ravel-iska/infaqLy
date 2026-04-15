import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Coins, Landmark, Clock, Users, ArrowRight } from 'lucide-react';
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
    { icon: Coins, label: 'Total Infaq', value: infaqTotal, trend: '+12.5%', up: true, color: 'text-admin-accent' },
    { icon: Landmark, label: 'Total Wakaf', value: wakafTotal, trend: '+8.3%', up: true, color: 'text-admin-accent-secondary' },
    { icon: Clock, label: 'Program Aktif', value: activeCampaigns.length, trend: `${campaigns.length} total`, up: true, color: 'text-warning' },
    { icon: Users, label: 'Donatur', value: totalDonors, trend: '+15%', up: true, color: 'text-admin-accent' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold text-admin-text">📊 Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="admin-card p-5">
              <div className="flex items-center justify-between mb-3">
                <Icon size={20} className={stat.color} />
                <span className={`text-xs font-semibold flex items-center gap-1 ${stat.up ? 'text-success' : 'text-danger'}`}>
                  {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {stat.trend}
                </span>
              </div>
              <p className="text-sm text-admin-text-secondary">{stat.label}</p>
              <p className="text-2xl font-bold text-admin-text mt-1 font-mono">
                {typeof stat.value === 'number' && stat.value > 9999
                  ? formatCurrencyShort(stat.value)
                  : (stat.value || 0).toLocaleString('id-ID')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Chart + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 admin-card p-5">
          <h2 className="text-lg font-semibold text-admin-text mb-4">📈 Grafik Donasi Bulanan</h2>
          {monthlyStats.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-admin-text-muted text-sm">
              Belum ada data donasi
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
                      `Total (${props.payload.count} txn)`
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

        <div className="lg:col-span-2 admin-card p-5">
          <h2 className="text-lg font-semibold text-admin-text mb-4">⚡ Transaksi Terkini</h2>
          <div className="space-y-3">
            {recentTxn.length === 0 ? (
              <p className="text-sm text-admin-text-muted text-center py-4">Belum ada transaksi</p>
            ) : recentTxn.map((tx) => (
              <div key={tx.orderId} className="flex items-center justify-between py-2 border-b border-admin-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-admin-text">{tx.donorName}</p>
                  <p className="text-xs text-admin-text-muted font-mono">{tx.orderId} · {formatTimeAgo(tx.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-admin-text font-mono">{formatCurrency(tx.amount)}</p>
                  <span className={
                    tx.paymentStatus === 'success' ? 'badge-admin-success' :
                    tx.paymentStatus === 'pending' ? 'badge-admin-warning' : 'badge-admin-danger'
                  }>
                    {tx.paymentStatus === 'success' ? '✅' : tx.paymentStatus === 'pending' ? '⏳' : '❌'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/admin-panel/transactions" className="flex items-center gap-1 text-sm text-admin-accent hover:text-admin-accent-hover mt-4 font-medium transition-colors">
            Lihat Semua <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Active Campaigns Table */}
      <div className="admin-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-admin-text">📋 Kampanye ({campaigns.length})</h2>
          <Link to="/admin-panel/campaigns/new" className="btn-admin-primary !py-2 !px-4 text-sm">+ Buat Baru</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="text-left px-4 py-3 text-admin-text-secondary font-medium">Nama Program</th>
                <th className="text-left px-4 py-3 text-admin-text-secondary font-medium">Target</th>
                <th className="text-left px-4 py-3 text-admin-text-secondary font-medium">Progress</th>
                <th className="text-center px-4 py-3 text-admin-text-secondary font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.slice(0, 5).map((c) => {
                const progress = c.target > 0 ? Math.round((c.collected / c.target) * 100) : 0;
                return (
                  <tr key={c.id} className="border-b border-admin-border last:border-0 hover:bg-admin-bg-hover transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(c.imageUrl || c.image) && <img src={c.imageUrl || c.image} alt="" className="w-8 h-8 rounded object-cover" />}
                        <span className="text-admin-text font-medium">{c.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-admin-text font-mono">{formatCurrencyShort(c.target)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-admin-bg-hover overflow-hidden">
                          <div className="h-full rounded-full bg-admin-accent-secondary" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        </div>
                        <span className="text-xs text-admin-text-muted font-mono w-10 text-right">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={
                        c.status === 'active' ? 'badge-admin-success' :
                        c.status === 'draft' ? 'badge-admin-warning' : 'badge-admin-danger'
                      }>
                        {c.status === 'active' ? '🟢 Aktif' : c.status === 'draft' ? '🟡 Draft' : '🔴 Selesai'}
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
