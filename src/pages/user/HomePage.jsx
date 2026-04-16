import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatCurrency, formatCurrencyShort } from '@/utils/formatCurrency';
import { getActiveCampaigns, daysRemaining } from '@/services/campaignService';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
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

  // Jika data belum ada dari backend, gunakan fallback/dummy stats seperti di desain awal
  const totalCollected = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.collected, 0) : 12400000000;
  const totalDonors = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.donors, 0) : 15800;
  const totalPrograms = campaigns.length > 0 ? campaigns.length : 420;

  const featured = campaigns.slice(0, 3);

  return (
    <div className="animate-fade-in bg-surface text-on-surface font-body pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden px-8 py-20 md:py-32 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold tracking-widest uppercase mb-6">
              #BerbagiItuIndah
            </span>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold text-on-surface leading-tight mb-8 tracking-tight">
              Berbagi Kebaikan Lewat <br className="hidden lg:block"/><span className="text-primary italic">Infaq & Wakaf</span> Digital
            </h1>
            <p className="text-lg text-on-surface-variant/80 mb-10 max-w-lg leading-relaxed">
              Platform amanah untuk menyalurkan kepedulian Anda. Ubah masa depan mereka dengan kontribusi nyata yang berkelanjutan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/explore" className="hero-gradient text-on-primary px-8 py-4 rounded-xl font-bold text-lg ambient-shadow transition-transform hover:scale-[1.02] text-center">
                Mulai Berdonasi
              </Link>
              <a href="#cara-donasi" className="flex items-center justify-center gap-2 border-2 border-outline-variant/30 text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">play_circle</span>
                Lihat Dampak
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden ambient-shadow rotate-3 scale-95 md:scale-100">
              <img 
                alt="Donasi InfaqLy" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtvLNhQLwSvJ39x5VIL3RdjIq7aIRowq59uuy8WHLxJLbsuJYRQb-wnxUfKG4QpoHhYNp1hgH0UtFv9-coaYSyRKtyWkaLuWPWCjHM9dhtslpu8Z2wk_8tH30MyMs89oljB-QbX6YydPjoQ4rv_hW-xMW0QJwzwaRrTgqTAurVy2pWuNmHX6Sumk9OWOlN5oRlehvw9XQZkIxq5pF0L36j_RXkloIbGT5T3joE9knYsdg0fOgz-hMkkpULym054L3WtPu9j4RPPa0"
              />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-surface-container-lowest p-6 rounded-2xl shadow-2xl max-w-xs border border-white/50 backdrop-blur-sm hidden sm:block">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant">Donasi Terverifikasi</p>
                  <p className="text-sm font-bold text-on-surface">99.9% Transparansi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats (Bento Grid) */}
      <section className="bg-surface-container-low py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-container-lowest p-8 rounded-3xl ambient-shadow border border-white/40 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-primary text-4xl mb-4">account_balance_wallet</span>
              <h3 className="text-4xl font-headline font-bold text-on-surface mb-2">{formatCurrencyShort(totalCollected)}+</h3>
              <p className="text-on-surface-variant text-sm font-medium">Total Terkumpul</p>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-3xl ambient-shadow border border-white/40 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-primary text-4xl mb-4">group</span>
              <h3 className="text-4xl font-headline font-bold text-on-surface mb-2">{totalDonors >= 1000 ? (totalDonors/1000).toFixed(1) + 'K' : totalDonors}</h3>
              <p className="text-on-surface-variant text-sm font-medium">Total Donatur</p>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-3xl ambient-shadow border border-white/40 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-primary text-4xl mb-4">volunteer_activism</span>
              <h3 className="text-4xl font-headline font-bold text-on-surface mb-2">{totalPrograms}+</h3>
              <p className="text-on-surface-variant text-sm font-medium">Program Aktif</p>
            </div>
          </div>
        </div>
      </section>

      {/* Program Unggulan Section */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="font-headline text-4xl font-bold mb-4">Program Unggulan</h2>
            <p className="text-on-surface-variant text-lg">Pilih program yang paling sesuai dengan kepedulian Anda dan mulailah menebar manfaat hari ini.</p>
          </div>
          <Link to="/explore" className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
            Lihat Semua <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        
        {featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {featured.map((campaign, idx) => (
              <CampaignCardHome key={campaign.id} campaign={campaign} idx={idx} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 opacity-50">
            <div className="text-center py-12 text-on-surface-variant col-span-3">
              <p>Belum ada program aktif saat ini</p>
            </div>
          </div>
        )}
      </section>

      {/* Cara Berdonasi Section */}
      <section id="cara-donasi" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="font-headline text-4xl font-bold mb-4 text-on-surface">Cara Mudah Berdonasi</h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">Hanya butuh beberapa menit untuk mulai memberikan dampak bagi sesama.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="relative group text-center">
              <div className="w-20 h-20 bg-surface-container rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary transition-all group-hover:bg-primary group-hover:text-on-primary ambient-shadow">
                <span className="material-symbols-outlined text-4xl">search</span>
              </div>
              <h4 className="font-bold text-lg mb-2">Pilih Program</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Cari program yang ingin Anda bantu melalui halaman jelajahi.</p>
              <div className="hidden md:block absolute top-10 -right-6 text-slate-200">
                <span className="material-symbols-outlined">trending_flat</span>
              </div>
            </div>
            <div className="relative group text-center">
              <div className="w-20 h-20 bg-surface-container rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary transition-all group-hover:bg-primary group-hover:text-on-primary ambient-shadow">
                <span className="material-symbols-outlined text-4xl">credit_score</span>
              </div>
              <h4 className="font-bold text-lg mb-2">Pilih Nominal</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Masukkan jumlah donasi sesuai dengan keinginan dan kemampuan.</p>
              <div className="hidden md:block absolute top-10 -right-6 text-slate-200">
                <span className="material-symbols-outlined">trending_flat</span>
              </div>
            </div>
            <div className="relative group text-center">
              <div className="w-20 h-20 bg-surface-container rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary transition-all group-hover:bg-primary group-hover:text-on-primary ambient-shadow">
                <span className="material-symbols-outlined text-4xl">payments</span>
              </div>
              <h4 className="font-bold text-lg mb-2">Bayar Donasi</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Gunakan berbagai metode pembayaran digital yang tersedia.</p>
              <div className="hidden md:block absolute top-10 -right-6 text-slate-200">
                <span className="material-symbols-outlined">trending_flat</span>
              </div>
            </div>
            <div className="group text-center">
              <div className="w-20 h-20 bg-surface-container rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary transition-all group-hover:bg-primary group-hover:text-on-primary ambient-shadow">
                <span className="material-symbols-outlined text-4xl">receipt_long</span>
              </div>
              <h4 className="font-bold text-lg mb-2">Terima Laporan</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Dapatkan update berkala mengenai penggunaan dana donasi Anda.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="max-w-7xl mx-auto px-8 mb-8 pb-10">
        <div className="hero-gradient rounded-[3rem] p-12 md:p-24 text-center text-on-primary relative overflow-hidden ambient-shadow">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          <h2 className="font-headline text-3xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto relative z-10">Wujudkan Dampak Nyata Hari Ini</h2>
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto relative z-10">Bergabunglah dengan ribuan donatur lainnya dalam menebar kebaikan yang terukur dan transparan.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            {!isAuthenticated ? (
              <Link to="/register" className="bg-white text-primary px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-surface transition-colors inline-block text-center">Daftar Sekarang</Link>
            ) : (
              <Link to="/profile" className="bg-white text-primary px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-surface transition-colors inline-block text-center">Dashboard Anda</Link>
            )}
            <Link to="/explore" className="bg-primary-container/20 border border-white/30 backdrop-blur-sm text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors inline-block text-center">Mulai Berdonasi</Link>
          </div>
        </div>
      </section>

    </div>
  );
}

function CampaignCardHome({ campaign, idx }) {
  const progress = campaign.target > 0 ? Math.round((campaign.collected / campaign.target) * 100) : 0;
  const days = daysRemaining(campaign.endDate);
  const categoryLabel = campaign.category === 'infaq' ? 'Infaq' : campaign.category === 'wakaf' ? 'Wakaf' : campaign.category;
  
  // Rotating colors for cards based on index
  const tagColorClass = idx % 3 === 0 
    ? 'bg-primary-container text-on-primary-container' 
    : idx % 3 === 1 
    ? 'bg-secondary-container text-on-secondary-container' 
    : 'bg-tertiary-container text-on-tertiary-container';

  return (
    <Link to={`/explore/${campaign.id}`} className="group bg-surface-container-lowest rounded-[2rem] overflow-hidden ambient-shadow border border-white/20 transition-all hover:-translate-y-2 block">
      <div className="relative h-64 overflow-hidden">
        <img 
          src={campaign.imageUrl || campaign.image || 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&h=250&fit=crop'} 
          alt={campaign.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className={`absolute top-4 left-4 ${tagColorClass} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest`}>
          {categoryLabel}
        </div>
      </div>
      <div className="p-8">
        <h3 className="font-headline text-xl font-bold mb-4 line-clamp-2 text-on-surface h-14">{campaign.title}</h3>
        <div className="mb-6">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-primary">{formatCurrency(campaign.collected)}</span>
            <span className="text-on-surface-variant">Target: {formatCurrencyShort(campaign.target)}</span>
          </div>
          <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="bg-primary-container h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
        </div>
        <div className="flex justify-between items-center mb-8">
          <div className="flex -space-x-3">
            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300"></div>
            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-400"></div>
            <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-container text-[10px] flex items-center justify-center font-bold text-on-primary">
              +{campaign.donors > 99 ? '99' : campaign.donors}
            </div>
          </div>
          {progress >= 100 ? (
            <span className="text-xs font-medium text-emerald-600 font-bold">Tercapai!</span>
          ) : days <= 0 ? (
            <span className="text-xs font-medium text-red-500 font-bold">Ditutup</span>
          ) : (
            <span className="text-xs font-medium text-on-surface-variant">{days} Hari Lagi</span>
          )}
        </div>
        <button className="w-full py-3 bg-surface-container text-primary font-bold rounded-xl transition-colors group-hover:bg-primary group-hover:text-on-primary block text-center">
          Donasi Sekarang
        </button>
      </div>
    </Link>
  );
}
