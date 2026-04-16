import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatCurrency, formatCurrencyShort } from '@/utils/formatCurrency';
import { getActiveCampaigns, daysRemaining } from '@/services/campaignService';

export default function ExplorePage() {
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const location = useLocation();

  const loadData = useCallback(async () => {
    try {
      const data = await getActiveCampaigns();
      setCampaigns(data);
    } catch {}
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

  return (
    <div className="animate-fade-in py-12 bg-surface min-h-screen font-body text-on-surface pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4">Jelajahi Program</h1>
          <p className="text-on-surface-variant text-lg">Temukan program donasi yang sesuai dengan hati dan kepedulian Anda.</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-surface-container-low p-4 md:p-6 rounded-[2rem] ambient-shadow border border-white/40 flex flex-col md:flex-row gap-4 mb-12">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-70">
              search
            </span>
            <input
              type="text"
              placeholder="Cari nama program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-full border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm md:text-base"
            />
          </div>

          {/* Select dropdowns */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-auto">
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full sm:min-w-[180px] appearance-none pl-6 pr-12 py-4 rounded-full border border-outline-variant/30 bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm md:text-base cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <option value="infaq">Kategori Infaq</option>
                <option value="wakaf">Kategori Wakaf</option>
              </select>
              <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>

            <div className="relative w-full sm:w-auto">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="w-full sm:min-w-[220px] appearance-none pl-6 pr-12 py-4 rounded-full border border-outline-variant/30 bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm md:text-base cursor-pointer"
              >
                <option value="newest">Urut: Terbaru</option>
                <option value="most-donors">Urut: Paling Banyak Donasi</option>
                <option value="ending-soon">Urut: Segera Berakhir</option>
              </select>
              <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                sort
              </span>
            </div>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-32 bg-surface-container-lowest rounded-[3rem] border border-white/20 ambient-shadow">
            <div className="w-24 h-24 mx-auto bg-surface-container rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/50">
                search_off
              </span>
            </div>
            <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">Tidak ada program ditemukan</h3>
            <p className="text-on-surface-variant">Coba ubah kata kunci atau filter kategori pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
  const categoryLabel = campaign.category === 'infaq' ? 'Infaq' : 'Wakaf';

  // Rotating colors for tabs to match the aesthetic from HomePage
  const tagColorClass = idx % 2 === 0 
    ? 'bg-primary-container text-on-primary-container' 
    : 'bg-tertiary-container text-on-tertiary-container';

  return (
    <Link to={`/explore/${campaign.id}`} className="group bg-surface-container-lowest rounded-[2rem] overflow-hidden ambient-shadow border border-white/20 transition-all hover:-translate-y-2 flex flex-col sm:flex-row h-full">
      
      {/* Image Block */}
      <div className="relative h-56 sm:h-auto sm:w-5/12 overflow-hidden flex-shrink-0">
        <img
          src={campaign.imageUrl || campaign.image || 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=600&auto=format&fit=crop&q=60'}
          alt={campaign.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className={`absolute top-4 left-4 ${tagColorClass} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest`}>
          {categoryLabel}
        </div>
      </div>

      {/* Content Block */}
      <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between">
        <div>
          <h3 className="font-headline text-xl font-bold mb-4 line-clamp-2 text-on-surface">{campaign.title}</h3>
          
          <div className="mb-6">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-primary">{formatCurrency(campaign.collected)}</span>
              <span className="text-on-surface-variant text-[10px] sm:text-xs">dari {formatCurrencyShort(campaign.target)}</span>
            </div>
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div 
                className="bg-primary-container h-full rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">group</span>
              {campaign.donors} Donatur
            </div>
            
            {progress >= 100 ? (
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> Tercapai
              </div>
            ) : days <= 0 ? (
              <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-[14px]">cancel</span> Ditutup
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-medium text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-[14px]">schedule</span> {days} Hari
              </div>
            )}
          </div>
          
          <button className="w-full py-3 bg-surface-container text-primary font-bold rounded-xl flex items-center justify-center gap-2 transition-colors group-hover:bg-primary group-hover:text-on-primary">
            Donasi Sekarang <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
      
    </Link>
  );
}
