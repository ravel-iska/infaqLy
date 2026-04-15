import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Filter, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
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
    <div className="animate-fade-in py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-user-text">Jelajahi Program</h1>
          <p className="mt-2 text-user-text-secondary">Temukan program donasi yang sesuai dengan hati Anda</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-user-text-muted" />
            <input
              type="text"
              placeholder="Cari nama program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-user pl-11"
            />
          </div>
          <div className="flex gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-user !w-auto min-w-[160px]">
              <option value="all">Semua Kategori</option>
              <option value="infaq">Infaq</option>
              <option value="wakaf">Wakaf</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-user !w-auto min-w-[160px]">
              <option value="newest">Terbaru</option>
              <option value="most-donors">Paling Banyak Donasi</option>
              <option value="ending-soon">Segera Berakhir</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Filter size={48} className="mx-auto text-user-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-user-text">Tidak ada program ditemukan</h3>
            <p className="text-sm text-user-text-secondary mt-1">Coba ubah kata kunci atau filter pencarian Anda</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((campaign) => (
              <CampaignListCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignListCard({ campaign }) {
  const progress = campaign.target > 0 ? Math.round((campaign.collected / campaign.target) * 100) : 0;
  const days = daysRemaining(campaign.endDate);
  const categoryLabel = campaign.category === 'infaq' ? 'Infaq' : 'Wakaf';

  return (
    <div className="user-card overflow-hidden flex flex-col md:flex-row">
      <div className="md:w-72 md:flex-shrink-0 overflow-hidden">
        <img
          src={campaign.imageUrl || campaign.image || 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&h=250&fit=crop'}
          alt={campaign.title}
          className="w-full h-48 md:h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${campaign.category === 'infaq' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {categoryLabel}
            </span>
          </div>
          <h3 className="text-xl font-bold text-user-text">{campaign.title}</h3>
          <div className="mt-4">
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ '--progress-width': `${Math.min(progress, 100)}%` }}></div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm font-semibold text-user-accent">{formatCurrency(campaign.collected)}</span>
              <span className="text-sm text-user-text-muted">dari {formatCurrency(campaign.target)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-user-border">
          <div className="flex gap-4 text-sm text-user-text-muted">
            <span>👥 {campaign.donors} donatur</span>
            <span>⏳ {days} hari lagi</span>
          </div>
          <Link to={`/explore/${campaign.id}`} className="btn-user-primary !py-2 !px-4 text-sm">
            Donasi Sekarang <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
