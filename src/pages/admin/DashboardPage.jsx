import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { formatCurrencyShort, formatCurrency } from '@/utils/formatCurrency';
import { formatTimeAgo } from '@/utils/formatDate';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllCampaigns } from '@/services/campaignService';
import api from '@/services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const { isAdminDark } = useTheme();
  const [campaigns, setCampaigns] = useState([]);
  const [recentTxn, setRecentTxn] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [visitorData, setVisitorData] = useState([]);
  const [visitorStats, setVisitorStats] = useState({ total: 0, growth: 0 });
  const [bugReports, setBugReports] = useState([]);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [campData, txData, chartData, vData] = await Promise.all([
          getAllCampaigns().catch(() => []),
          api.get('/donations?limit=5').catch(() => ({ donations: [] })),
          api.get('/campaigns/monthly-stats').catch(() => ({ months: [] })),
          api.get('/visitors/stats').catch(() => [])
        ]);
        setCampaigns(campData);
        setRecentTxn((txData.donations || []).slice(0, 5));
        setMonthlyStats(chartData.months || []);

        if (Array.isArray(vData)) {
          const ordered = [...vData].reverse();
          setVisitorData(ordered);
          let sum = 0;
          ordered.forEach(v => sum += v.visitors);

          const todayAmt = ordered[ordered.length - 1]?.visitors || 0;
          const yesterdayAmt = ordered[ordered.length - 2]?.visitors || 0;
          const pct = yesterdayAmt > 0 ? Math.round(((todayAmt - yesterdayAmt) / yesterdayAmt) * 100) : (todayAmt > 0 ? 100 : 0);

          setVisitorStats({ total: sum, growth: pct });
        }
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
    } catch { }
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

  // METRIK KREATIF AKTIVITAS
  const todayVisitor = visitorData.length > 0 ? visitorData[visitorData.length - 1].visitors : 0;
  const totalPahlawan = campaigns.reduce((s, c) => s + c.donors, 0);
  const ruangAktif = campaigns.filter(c => c.status === 'active').length;
  const misiSelesai = campaigns.filter(c => c.target > 0 && c.collected >= c.target).length;

  const STATS = [
    { icon: 'visibility', label: 'Visitor Harian', value: todayVisitor, trend: 'Trafik hari ini', up: true, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: 'volunteer_activism', label: 'Pahlawan Kebaikan', value: totalPahlawan, trend: 'Aksi hamba Allah', up: true, color: 'text-secondary', bg: 'bg-secondary/10' },
    { icon: 'rocket_launch', label: 'Ruang Berbagi Aktif', value: ruangAktif, trend: 'Sedang menggalang dana', up: true, color: 'text-info', bg: 'bg-info/10' },
    { icon: 'task_alt', label: 'Target Terselesaikan', value: misiSelesai, trend: 'Misi sukses 100%', up: true, color: 'text-success', bg: 'bg-success/10' },
    { icon: 'payments', label: 'Total Infaq Terkumpul', value: formatCurrencyShort(campaigns.reduce((s, c) => s + c.collected, 0)), trend: 'Dana terhimpun', up: true, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: 'analytics', label: 'Rata-rata Infaq', value: totalPahlawan > 0 ? formatCurrencyShort(campaigns.reduce((s, c) => s + c.collected, 0) / totalPahlawan) : '0', trend: 'Per transaksi', up: true, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  // DATA KATEGORI UNTUK PIE CHART
  const categoryData = Object.entries(
    campaigns.reduce((acc, c) => {
      const cat = c.category === 'infaq' ? 'Infaq' : c.category === 'wakaf' ? 'Wakaf' : (c.category || 'Lainnya');
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Real visitor data fetched mapped to visitorData state

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-base-content/5 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] text-white drop-shadow-sm">space_dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight font-headline">Dashboard Overview</h1>
        </div>
        <button onClick={() => setIsBugModalOpen(true)} className="btn btn-ghost btn-circle relative hover:bg-base-200 tooltip tooltip-left" data-tip="Laporan Bug / Masukan">
          <span className="material-symbols-outlined text-rose-500 text-[28px]">mark_email_unread</span>
          {bugReports.filter(b => !b.isRead).length > 0 && (
            <span className="absolute top-0 right-0 badge badge-error badge-sm">{bugReports.filter(b => !b.isRead).length}</span>
          )}
        </button>
      </div>

      {/* Stats Grid - Metronic Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {isLoading
          ? [...Array(4)].map((_, i) => (
            <div key={i} className="bg-base-200/50 shadow-sm rounded-[1.5rem] p-6 h-[140px] animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-base-300"></div>
                <div className="w-16 h-6 rounded-md bg-base-300"></div>
              </div>
              <div className="w-24 h-4 rounded bg-base-300 mb-2"></div>
              <div className="w-32 h-8 rounded bg-base-300"></div>
            </div>
          ))
          : STATS.map((stat) => (
            <div key={stat.label} className="bg-base-100 backdrop-blur-xl shadow-lg shadow-base-200/30 rounded-[1.5rem] p-6 border border-base-200 hover:shadow-2xl hover:shadow-emerald-500/15 hover:-translate-y-2 hover:border-emerald-500/30 transition-all duration-500 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${stat.bg} shadow-inner`}>
                  <span className={`material-symbols-outlined ${stat.color} text-[26px]`}>{stat.icon}</span>
                </div>
                <span className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${stat.up ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'} shadow-sm`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {stat.up ? 'trending_up' : 'trending_down'}
                  </span>
                  {stat.trend}
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-sm font-semibold text-base-content/60">{stat.label}</p>
                <p className="text-3xl font-black text-base-content mt-1 font-headline tracking-tight leading-none pt-1">
                  {typeof stat.value === 'string' ? stat.value : (typeof stat.value === 'number' && stat.value > 9999 ? formatCurrencyShort(stat.value) : (stat.value || 0).toLocaleString('id-ID'))}
                </p>
              </div>
            </div>
          ))}
      </div>

      {/* Row: Distribution & Category Summary (Primary Focus) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-base-100 backdrop-blur-xl shadow-lg shadow-base-200/30 rounded-[1.5rem] p-6 border border-base-200 flex flex-col relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <span className="material-symbols-outlined text-[20px]">pie_chart</span>
            </div>
            <h2 className="text-lg font-bold text-base-content">Sebaran Program</h2>
          </div>
          <div className="h-64 relative z-10">
            {isLoading ? (
              <div className="h-full w-full bg-base-200/50 animate-pulse rounded-full"></div>
            ) : categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-base-content/40">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <LineTooltip
                    contentStyle={{
                      backgroundColor: isAdminDark ? '#1E293B' : '#ffffff',
                      borderColor: isAdminDark ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ color: isAdminDark ? '#94A3B8' : '#64748B' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-2xl font-black text-base-content">{campaigns.length}</p>
              <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Total</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 relative z-10">
            {categoryData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 p-2 rounded-lg bg-base-200/40 border border-base-200">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-xs font-bold text-base-content/70">{d.name}</span>
                <span className="text-xs font-black text-base-content ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 admin-card p-8 flex flex-col justify-between overflow-hidden relative group border-indigo-500/20">
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none transition-transform group-hover:scale-150 duration-700"></div>

          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-base-content">Laporan Keuangan Global</h2>
                <p className="text-sm text-base-content/50 font-medium">Rekapitulasi target dan realisasi donasi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-base-content/60">Terkumpul Terhadap Target</span>
                    <span className="text-2xl font-black text-emerald-500 font-headline">
                      {Math.round((campaigns.reduce((s, c) => s + c.collected, 0) / (campaigns.reduce((s, c) => s + Math.max(c.target, c.collected), 0) || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-base-200 rounded-full overflow-hidden border border-base-300 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      style={{ width: `${Math.min(100, (campaigns.reduce((s, c) => s + c.collected, 0) / (campaigns.reduce((s, c) => s + Math.max(c.target, c.collected), 0) || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 rounded-2xl bg-base-200/30 border border-base-200">
                    <p className="text-[11px] font-bold text-base-content/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Total Realisasi
                    </p>
                    <p className="text-2xl font-black text-base-content font-headline tracking-tight">
                      {formatCurrency(campaigns.reduce((s, c) => s + c.collected, 0))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-end space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                  <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">Estimasi Kekurangan</p>
                  <p className="text-2xl font-black text-base-content font-headline tracking-tight">
                    {formatCurrency(Math.max(0, campaigns.reduce((s, c) => s + c.target, 0) - campaigns.reduce((s, c) => s + c.collected, 0)))}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-base-200/30 border border-base-200">
                  <p className="text-[11px] font-bold text-base-content/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Total Target Kolektif
                  </p>
                  <p className="text-xl font-bold text-base-content/80 font-headline">
                    {formatCurrency(campaigns.reduce((s, c) => s + c.target, 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-base-200 flex items-center justify-between">
            <p className="text-xs text-base-content/40 font-medium">Berdasarkan data dari <span className="text-indigo-500 font-bold">{campaigns.length}</span> program yang berjalan saat ini.</p>
            <Link to="/admin-panel/transactions" className="text-xs font-black text-indigo-500 hover:underline uppercase tracking-widest flex items-center gap-1">
              Audit Keuangan <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Chart + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-base-100 backdrop-blur-xl shadow-lg shadow-base-200/30 rounded-[1.5rem] p-6 border border-base-200 overflow-hidden relative group">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <span className="material-symbols-outlined text-[20px]">monitoring</span>
            </div>
            <h2 className="text-lg font-bold text-base-content">Grafik Donasi Bulanan</h2>
          </div>
          {isLoading ? (
            <div className="h-64 mt-2 bg-base-200/50 rounded-xl animate-pulse"></div>
          ) : monthlyStats.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-base-content/40 bg-base-200/30 rounded-xl border border-dashed border-base-300">
              <span className="material-symbols-outlined text-4xl mb-3 opacity-50">bar_chart</span>
              <p className="text-sm font-medium">Belum ada data donasi bulan ini</p>
            </div>
          ) : (
            <div className="h-72 w-full mt-2 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyStats} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isAdminDark ? "#1E293B" : "#E2E8F0"} strokeOpacity={0.5} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isAdminDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isAdminDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(value) => formatCurrencyShort(value)}
                    width={50}
                  />
                  <LineTooltip
                    contentStyle={{
                      backgroundColor: isAdminDark ? '#1E293B' : '#ffffff',
                      borderColor: isAdminDark ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#10B981', fontWeight: '800' }}
                    labelStyle={{ color: isAdminDark ? '#94A3B8' : '#64748B', marginBottom: '4px', fontWeight: 'bold' }}
                    formatter={(value, name, props) => [
                      formatCurrency(value),
                      `Total (${props.payload.count} transaksi)`
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    activeDot={{ r: 6, fill: '#10B981', stroke: '#ffffff', strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Visitor Traffic (Replaces Pie Chart) */}
        <div className="lg:col-span-2 bg-gradient-to-b from-base-100 to-base-200/30 backdrop-blur-xl border border-base-200 shadow-lg shadow-base-200/30 rounded-[1.5rem] p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-125"></div>

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <span className="material-symbols-outlined text-[20px]">group</span>
              </div>
              <h2 className="text-lg font-bold text-base-content">Trafik Jangkauan</h2>
            </div>
            <div className="badge badge-sm border border-success/20 bg-success/10 text-success font-bold gap-1 py-3 px-3 shadow-sm rounded-lg">
              7 Hari Terakhir
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end mt-2 relative z-10">
            {isLoading ? (
              <div className="w-full h-full rounded-xl bg-base-200/50 animate-pulse min-h-[200px]"></div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-4xl font-headline font-black text-base-content tracking-tight">{visitorStats.total.toLocaleString('id-ID')}</p>
                  <p className="text-sm font-medium text-base-content/60 mt-1.5 flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-[18px] ${visitorStats.growth >= 0 ? 'text-success' : 'text-error'}`}>
                      {visitorStats.growth >= 0 ? 'trending_up' : 'trending_down'}
                    </span>
                    Jangkauan {visitorStats.growth >= 0 ? 'naik' : 'turun'} <span className={`${visitorStats.growth >= 0 ? 'text-success' : 'text-error'} font-bold`}>{Math.abs(visitorStats.growth)}%</span> dari kemarin
                  </p>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visitorData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: isAdminDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: 600 }}
                        dy={5}
                      />
                      <LineTooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                          backgroundColor: isAdminDark ? '#1E293B' : '#ffffff',
                          borderColor: isAdminDark ? '#334155' : '#e2e8f0',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#F59E0B', fontWeight: '800' }}
                        labelStyle={{ display: 'none' }}
                        formatter={(value) => [value, 'Kunjungan']}
                      />
                      <Bar
                        dataKey="visitors"
                        fill="url(#colorVisitors)"
                        radius={[8, 8, 8, 8]}
                        barSize={28}
                        animationDuration={1500}
                      >
                        <defs>
                          <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                            <stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Active Campaigns Table + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Active Campaigns Table (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-base-100 backdrop-blur-xl shadow-lg shadow-base-200/30 rounded-[1.5rem] p-0 border border-base-200 overflow-hidden flex flex-col group">
          <div className="p-6 border-b border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[20px]">campaign</span>
              </div>
              <h2 className="text-lg font-bold text-base-content">Daftar Kampanye Aktif</h2>
            </div>
            <Link to="/admin-panel/campaigns/new" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">add</span> Buat Baru
            </Link>
          </div>

          <div className="overflow-x-auto flex-1 p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-base-content/60 text-xs uppercase tracking-wider font-bold bg-base-200/50 rounded-xl">
                  <th className="p-4 rounded-l-xl font-bold">Nama Program</th>
                  <th className="p-4 font-bold">Target</th>
                  <th className="p-4 font-bold">Progress</th>
                  <th className="p-4 text-center rounded-r-xl font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={`skel-${i}`} className="animate-pulse border-b border-base-200 last:border-0">
                      <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-base-300"></div><div className="h-4 w-32 bg-base-300 rounded"></div></div></td>
                      <td className="p-4"><div className="h-4 w-16 bg-base-300 rounded"></div></td>
                      <td className="p-4"><div className="h-2 w-24 bg-base-300 rounded"></div></td>
                      <td className="p-4 text-center"><div className="h-6 w-16 bg-base-300 rounded-lg mx-auto"></div></td>
                    </tr>
                  ))
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-base-content/40">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-4xl opacity-40">inbox</span>
                        <p>Tidak ada kampanye aktif. <Link to="/admin-panel/campaigns/new" className="text-emerald-500 hover:text-emerald-600 font-bold hover:underline">Buat sekarang</Link>.</p>
                      </div>
                    </td>
                  </tr>
                ) : campaigns.slice(0, 5).map((c) => {
                  const progress = c.target > 0 ? Math.round((c.collected / c.target) * 100) : 0;
                  return (
                    <tr key={c.id} className="border-b border-base-200 last:border-0 hover:bg-base-200/30 transition-colors">
                      <td className="p-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-base-200 flex-shrink-0 flex items-center justify-center border border-base-300 shadow-sm">
                            {(c.imageUrl || c.image) ? (
                              <img src={c.imageUrl || c.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-[20px] text-base-content/40">image</span>
                            )}
                          </div>
                          <span className="font-bold text-base-content line-clamp-2 max-w-[200px] leading-tight">{c.title}</span>
                        </div>
                      </td>
                      <td className="p-4 py-3 font-mono font-bold text-base-content/70 whitespace-nowrap text-[13px]">
                        {formatCurrencyShort(c.target)}
                      </td>
                      <td className="p-4 py-3">
                        <div className="flex items-center gap-3 w-36">
                          <div className="flex-1 h-2 bg-base-200 rounded-full overflow-hidden border border-base-300">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                          </div>
                          <span className="text-xs font-mono font-bold text-base-content/60 w-9 text-right">{progress}%</span>
                        </div>
                      </td>
                      <td className="p-4 py-3 text-center">
                        <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${c.status === 'active' ? 'bg-success/10 text-success border border-success/20' :
                          c.status === 'draft' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-base-200 text-base-content/50 border border-base-300'
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
        <div className="lg:col-span-2 bg-base-100 backdrop-blur-xl border border-base-200 shadow-xl rounded-[1.5rem] p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none"></div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </div>
            <h2 className="text-lg font-bold text-base-content tracking-tight">Transaksi Terkini</h2>
          </div>
          <div className="space-y-3 flex-1 relative z-10">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={`tx-skel-${i}`} className="flex items-center justify-between p-4 rounded-xl bg-white/5 animate-pulse">
                  <div>
                    <div className="h-4 w-28 bg-white/10 rounded mb-2"></div>
                    <div className="h-3 w-36 bg-white/10 rounded"></div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="h-4 w-20 bg-white/10 rounded mb-2"></div>
                    <div className="h-5 w-16 bg-white/10 rounded-lg"></div>
                  </div>
                </div>
              ))
            ) : recentTxn.length === 0 ? (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-white/50">
                <span className="material-symbols-outlined text-5xl mb-3 opacity-30">receipt_long</span>
                <p className="text-sm font-medium">Belum ada transaksi</p>
              </div>
            ) : recentTxn.map((tx) => (
              <div key={tx.orderId} className="flex items-center justify-between p-4 rounded-xl bg-base-200/50 hover:bg-base-200 border border-base-300 transition-all hover:scale-[1.02] cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-base-content">{tx.donorName}</p>
                  <p className="text-[11px] text-base-content/50 font-mono mt-1">{tx.orderId.substring(0, 15)}... · {formatTimeAgo(tx.createdAt)}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mb-1">{formatCurrency(tx.amount)}</p>
                  <div className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${tx.paymentStatus === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    tx.paymentStatus === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                    {tx.paymentStatus}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/admin-panel/transactions" className="w-full mt-5 py-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors relative z-10">
            Lihat Semua Transaksi <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
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
