import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatCurrency, formatCurrencyShort } from '@/utils/formatCurrency';
import { getActiveCampaigns, daysRemaining } from '@/services/campaignService';

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
    return () => window.removeEventListener('focus', handleFocus);
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
    <div className="animate-fade-in pt-24 pb-12 bg-surface dark:bg-slate-900 font-body text-on-surface dark:text-slate-100 min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4 dark:text-white">Jelajahi Program</h1>
          <p className="text-on-surface-variant dark:text-slate-400 text-lg">Temukan program donasi yang sesuai dengan hati dan kepedulian Anda.</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-surface-container-low dark:bg-slate-800 p-4 md:p-6 rounded-[2rem] ambient-shadow border border-white/40 dark:border-slate-700 flex flex-col md:flex-row gap-4 mb-12">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-500 opacity-70">
              search
            </span>
            <input
              type="text"
              placeholder="Cari nama program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-full border border-outline-variant/30 dark:border-slate-600 bg-surface-container-lowest dark:bg-slate-900 text-on-surface dark:text-slate-100 placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary dark:focus:border-emerald-500 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm md:text-base"
            />
          </div>

          {/* Select dropdowns */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-auto">
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full sm:min-w-[180px] appearance-none pl-6 pr-12 py-4 rounded-full border border-outline-variant/30 dark:border-slate-600 bg-surface-container-lowest dark:bg-slate-900 text-on-surface dark:text-slate-200 focus:outline-none focus:border-primary dark:focus:border-emerald-500 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm md:text-base cursor-pointer capitalize"
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'Semua Kategori' : cat}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-500 pointer-events-none">
                expand_more
              </span>
            </div>

            <div className="relative w-full sm:w-auto">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="w-full sm:min-w-[220px] appearance-none pl-6 pr-12 py-4 rounded-full border border-outline-variant/30 dark:border-slate-600 bg-surface-container-lowest dark:bg-slate-900 text-on-surface dark:text-slate-200 focus:outline-none focus:border-primary dark:focus:border-emerald-500 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm md:text-base cursor-pointer"
              >
                <option value="newest">Terbaru</option>
                <option value="most-donors">Paling Banyak Donasi</option>
                <option value="ending-soon">Segera Berakhir</option>
              </select>
              <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-500 pointer-events-none">
                sort
              </span>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface-container-lowest dark:bg-slate-800 rounded-[2rem] overflow-hidden ambient-shadow h-[450px] animate-pulse">
                <div className="h-64 bg-slate-200 dark:bg-slate-700 w-full mb-6"></div>
                <div className="px-8 flex flex-col gap-4">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 bg-surface-container-lowest dark:bg-slate-800 rounded-[3rem] border border-white/20 dark:border-slate-700 ambient-shadow">
            <div className="w-24 h-24 mx-auto bg-surface-container dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 dark:text-slate-500">
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
          src={campaign.imageUrl || campaign.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtvLNhQLwSvJ39x5VIL3RdjIq7aIRowq59uuy8WHLxJLbsuJYRQb-wnxUfKG4QpoHhYNp1hgH0UtFv9-coaYSyRKtyWkaLuWPWCjHM9dhtslpu8Z2wk_8tH30MyMs89oljB-QbX6YydPjoQ4rv_hW-xMW0QJwzwaRrTgqTAurVy2pWuNmHX6Sumk9OWOlN5oRlehvw9XQZkIxq5pF0L36j_RXkloIbGT5T3joE9knYsdg0fOgz-hMkkpULym054L3WtPu9j4RPPa0'} 
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
