import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatCurrency, formatCurrencyShort } from '@/utils/formatCurrency';
import { getActiveCampaigns, daysRemaining } from '@/services/campaignService';
import { optimizeImageUrl } from '@/utils/optimizeImage';

export default function ExplorePage() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const location = useLocation();

  const loadData = useCallback(async () => {
    try {
      const data = await getActiveCampaigns();
      setCampaigns(data);
    } catch {} finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [location.pathname]);

  useEffect(() => {
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [loadData]);

  const filtered = campaigns
    .filter((c) => {
      if (category !== 'all' && c.category !== category) return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'most-donors') return b.donors - a.donors;
      if (sortBy === 'ending-soon') return daysRemaining(a.endDate) - daysRemaining(b.endDate);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const uniqueCategories = ['all', ...new Set(campaigns.map(c => c.category))];

  return (
    <div className="animate-fade-in bg-surface dark:bg-slate-900 font-body text-on-surface dark:text-slate-100 min-h-screen transition-colors duration-300">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-900 pt-28 pb-16 px-4 md:px-8">
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-teal-400/10 rounded-full blur-[100px]"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-bold tracking-widest uppercase mb-6">
            <span className="material-symbols-outlined text-[16px]">explore</span> Jelajahi
          </span>
          <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4 text-white">Jelajahi Program</h1>
          <p className="text-slate-300 text-lg max-w-xl">Temukan program donasi yang sesuai dengan hati dan kepedulian Anda.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20">

        {/* Glassmorphic Search & Filters */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-5 md:p-6 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/60 dark:border-slate-700/60 flex flex-col md:flex-row gap-4 mb-12">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 dark:text-emerald-400">
              search
            </span>
            <input
              type="text"
              placeholder="Cari nama program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-on-surface dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-sm md:text-base"
            />
          </div>

          {/* Select dropdowns */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-auto">
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full sm:min-w-[170px] appearance-none pl-5 pr-12 py-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-on-surface dark:text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-sm cursor-pointer capitalize"
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'Semua Kategori' : cat}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
                expand_more
              </span>
            </div>

            <div className="relative w-full sm:w-auto">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="w-full sm:min-w-[200px] appearance-none pl-5 pr-12 py-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-on-surface dark:text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-sm cursor-pointer"
              >
                <option value="newest">Terbaru</option>
                <option value="most-donors">Paling Banyak Donasi</option>
                <option value="ending-soon">Segera Berakhir</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
                sort
              </span>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-lg h-[450px] animate-pulse">
                <div className="h-56 bg-slate-200 dark:bg-slate-700 w-full"></div>
                <div className="p-7 flex flex-col gap-4">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-full"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 bg-surface-container-lowest dark:bg-slate-800 rounded-[3rem] border border-white/20 dark:border-slate-700 ambient-shadow">
            <div className="w-24 h-24 mx-auto bg-surface-container dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant dark:text-slate-500">
                search_off
              </span>
            </div>
            <h3 className="font-headline text-2xl font-bold text-on-surface dark:text-white mb-2">Tidak ada program ditemukan</h3>
            <p className="text-on-surface-variant dark:text-slate-400">Coba ubah kata kunci atau filter kategori pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((campaign, idx) => (
              <CampaignListCard key={campaign.id} campaign={campaign} idx={idx} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

function CampaignListCard({ campaign, idx }) {
  const progress = campaign.target > 0 ? Math.round((campaign.collected / campaign.target) * 100) : 0;
  const days = daysRemaining(campaign.endDate);
  const categoryLabel = campaign.category === 'infaq' ? 'Infaq' : campaign.category === 'wakaf' ? 'Wakaf' : campaign.category;

  // Rotating colors for tabs to match the aesthetic from HomePage
  const tagColorClass = idx % 2 === 0 
    ? 'bg-primary-container dark:bg-emerald-900/40 text-on-primary-container dark:text-emerald-400 border border-emerald-500/20' 
    : 'bg-tertiary-container dark:bg-purple-900/40 text-on-tertiary-container dark:text-purple-400 border border-purple-500/20';

  return (
    <Link to={`/explore/${campaign.id}`} className="group bg-surface-container-lowest dark:bg-slate-800 rounded-[2rem] overflow-hidden ambient-shadow border border-slate-100 dark:border-slate-700 transition-all hover:-translate-y-2 block h-full">
      <div className="relative h-64 overflow-hidden">
        <img 
          src={optimizeImageUrl(campaign.imageUrl || campaign.image, 400) || 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&h=250&fit=crop&fm=webp&q=75'} 
          alt={campaign.title} 
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className={`absolute top-4 left-4 ${tagColorClass} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md`}>
          {categoryLabel}
        </div>
      </div>
      <div className="p-8 flex flex-col h-[calc(100%-16rem)]">
        <h3 className="font-headline text-xl font-bold mb-4 line-clamp-2 text-on-surface dark:text-white h-14">{campaign.title}</h3>
        <div className="mb-6">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-primary dark:text-emerald-400">{formatCurrency(campaign.collected)}</span>
            <span className="text-on-surface-variant dark:text-slate-400">Target: {formatCurrencyShort(campaign.target)}</span>
          </div>
          <div className="w-full h-2 bg-surface-container-highest dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="bg-primary-container dark:bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
        </div>
        <div className="flex justify-between items-center mb-8">
          <div className="flex -space-x-3">
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700"></div>
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-300 dark:bg-slate-600"></div>
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-400 dark:bg-slate-500"></div>
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-primary-container dark:bg-emerald-900/80 text-[10px] flex items-center justify-center font-bold text-on-primary dark:text-emerald-400">
              +{campaign.donors > 99 ? '99' : campaign.donors}
            </div>
          </div>
          {progress >= 100 ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Tercapai!</span>
          ) : days <= 0 ? (
            <span className="text-xs text-red-500 dark:text-red-400 font-bold">Ditutup</span>
          ) : (
            <span className="text-xs font-medium text-on-surface-variant dark:text-slate-400">{days} Hari Lagi</span>
          )}
        </div>
        <button className="w-full py-3 bg-surface-container dark:bg-emerald-500/10 text-primary dark:text-emerald-400 font-bold rounded-xl transition-colors group-hover:bg-primary dark:group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:text-white block text-center mt-auto border border-transparent dark:border-emerald-500/20">
          Donasi Sekarang
        </button>
      </div>
    </Link>
  );
}
