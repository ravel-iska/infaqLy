import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Heart, Users, FolderOpen, ClipboardList, Coins, CreditCard, Smartphone } from 'lucide-react';
import { formatCurrency, formatCurrencyShort } from '@/utils/formatCurrency';
import { getActiveCampaigns, daysRemaining } from '@/services/campaignService';

const STEPS = [
  { icon: ClipboardList, num: 1, title: 'Pilih Program', desc: 'Pilih program donasi yang sesuai dengan hati Anda' },
  { icon: Coins, num: 2, title: 'Isi Nominal', desc: 'Masukkan jumlah donasi yang ingin Anda salurkan' },
  { icon: CreditCard, num: 3, title: 'Bayar via Snap', desc: 'Bayar dengan mudah melalui Midtrans Snap' },
  { icon: Smartphone, num: 4, title: 'Terima Bukti', desc: 'Notifikasi WhatsApp & sertifikat PDF otomatis' },
];

export default function HomePage() {
  const [campaigns, setCampaigns] = useState([]);
  const location = useLocation();

  const loadData = useCallback(async () => {
    try {
      const data = await getActiveCampaigns();
      setCampaigns(data);
    } catch {}
  }, []);

  // Re-fetch saat navigasi ke halaman ini
  useEffect(() => {
    loadData();
  }, [location.pathname]);

  // Re-fetch saat tab browser difokuskan kembali
  useEffect(() => {
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadData]);

  const totalCollected = campaigns.reduce((s, c) => s + c.collected, 0);
  const totalDonors = campaigns.reduce((s, c) => s + c.donors, 0);

  const STATS = [
    { icon: Coins, label: 'Total Terkumpul', value: totalCollected, format: 'currency' },
    { icon: Users, label: 'Total Donatur', value: totalDonors, format: 'number' },
    { icon: FolderOpen, label: 'Program Aktif', value: campaigns.length, format: 'number' },
  ];

  const featured = campaigns.slice(0, 3);

  return (
    <div className="animate-fade-in">
      {/* ══════ HERO ══════ */}
      <section className="hero-gradient py-12 sm:py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-user-text leading-tight">
              Berbagi Kebaikan Lewat{' '}
              <span className="text-user-accent">Infaq & Wakaf</span>{' '}
              Digital
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-user-text-secondary max-w-2xl mx-auto">
              Salurkan infaq Anda dengan mudah dan transparan melalui platform digital yang terpercaya. Setiap rupiah tercatat, setiap donasi bermakna.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/explore" className="btn-user-primary w-full sm:w-auto text-base px-6 py-3.5 sm:px-8 sm:py-4">
                🤲 Mulai Berdonasi
              </Link>
              <a href="#cara-donasi" className="inline-flex items-center justify-center w-full sm:w-auto p-3 text-user-accent font-semibold hover:gap-3 transition-all">
                Pelajari Lebih <ArrowRight size={18} className="ml-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ STATISTIK ══════ */}
      <section className="py-8 sm:py-16 -mt-8 sm:-mt-12 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="user-card p-4 sm:p-6 text-center flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 sm:gap-0">
                  <div className="w-12 h-12 sm:mx-auto mb-0 sm:mb-3 rounded-full bg-user-accent-light flex-shrink-0 flex items-center justify-center">
                    <Icon size={24} className="text-user-accent" />
                  </div>
                  <div className="text-left sm:text-center w-full">
                    <p className="text-xs sm:text-sm text-user-text-secondary">{stat.label}</p>
                    <p className="text-lg sm:text-2xl font-bold text-user-text mt-0.5 sm:mt-1">
                      {stat.format === 'currency' ? formatCurrencyShort(stat.value) : stat.value.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ PROGRAM UNGGULAN ══════ */}
      <section className="py-10 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-user-text">Program Unggulan</h2>
            <p className="mt-2 text-sm sm:text-base text-user-text-secondary">Kampanye donasi yang sedang berjalan dan membutuhkan dukungan Anda</p>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featured.map((campaign) => (
                <CampaignCardHome key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-user-text-muted">
              <p>Belum ada program aktif saat ini</p>
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/explore" className="btn-user-ghost w-full sm:w-auto">
              Lihat Semua Program <ArrowRight size={18} className="ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════ CARA BERDONASI ══════ */}
      <section id="cara-donasi" className="py-16 user-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-user-text">Cara Berdonasi</h2>
            <p className="mt-2 text-user-text-secondary">Empat langkah mudah untuk menyalurkan kebaikan Anda</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="text-center relative">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-user-accent flex items-center justify-center shadow-glow-emerald">
                    <Icon size={28} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-user-text mb-1">{step.title}</h3>
                  <p className="text-sm text-user-text-secondary">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ CTA ══════ */}
      <section className="py-20 cta-gradient">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Setiap Rupiah Anda Berarti
          </h2>
          <p className="mt-4 text-emerald-100 text-lg">
            Mulai salurkan kebaikan Anda hari ini. Bersama kita wujudkan perubahan.
          </p>
          <Link to="/explore" className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-white text-user-accent font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200">
            <Heart size={20} className="fill-user-accent" />
            Mulai Berdonasi
          </Link>
        </div>
      </section>
    </div>
  );
}

function CampaignCardHome({ campaign }) {
  const progress = campaign.target > 0 ? Math.round((campaign.collected / campaign.target) * 100) : 0;
  const days = daysRemaining(campaign.endDate);
  const categoryLabel = campaign.category === 'infaq' ? 'Infaq' : 'Wakaf';

  return (
    <Link to={`/explore/${campaign.id}`} className="user-card overflow-hidden group cursor-pointer block">
      <div className="relative overflow-hidden">
        <img
          src={campaign.imageUrl || campaign.image || 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&h=250&fit=crop'}
          alt={campaign.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full ${campaign.category === 'infaq' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
          {categoryLabel}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-user-text text-lg group-hover:text-user-accent transition-colors line-clamp-1">
          {campaign.title}
        </h3>
        <div className="mt-3">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ '--progress-width': `${Math.min(progress, 100)}%` }}></div>
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-user-accent font-semibold">{formatCurrency(campaign.collected)}</span>
            <span className="text-user-text-muted">{progress}%</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-user-border">
          <span className="text-xs text-user-text-muted">👥 {campaign.donors} donatur</span>
          <span className="text-xs text-user-text-muted">⏳ {days} hari lagi</span>
        </div>
      </div>
    </Link>
  );
}
