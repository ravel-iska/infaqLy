import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatCurrency, formatCurrencyShort } from '@/utils/formatCurrency';
import { getActiveCampaigns, daysRemaining } from '@/services/campaignService';
import { optimizeImageUrl } from '@/utils/optimizeImage';
import { useAuth } from '@/contexts/AuthContext';

// ═══ Animated Counter Hook ═══
function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true;
        const start = performance.now();
        const step = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

// ═══ Reveal On Scroll Wrapper ═══
function RevealOnScroll({ children, className = "", delay = 0, direction = 'up' }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => setIsVisible(true), delay);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.15 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  const dirClass = direction === 'up' ? 'translate-y-12' : direction === 'left' ? 'translate-x-12' : direction === 'right' ? '-translate-x-12' : 'scale-95';

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : `opacity-0 ${dirClass}`} ${className}`}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpactOpen, setIsImpactOpen] = useState(false);
  const location = useLocation();

  const loadData = useCallback(async () => {
    try {
      const data = await getActiveCampaigns();
      setCampaigns(data);
    } catch { } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [location.pathname]);

  useEffect(() => {
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(() => { loadData(); }, 30000);
    return () => { window.removeEventListener('focus', handleFocus); clearInterval(interval); };
  }, [loadData]);

  const totalCollected = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.collected, 0) : 12400000000;
  const totalDonors = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.donors, 0) : 15800;
  const totalPrograms = campaigns.length > 0 ? campaigns.length : 420;
  const featured = campaigns.slice(0, 3);

  return (
    <div className="bg-surface dark:bg-slate-900 text-on-surface dark:text-slate-100 font-body transition-colors duration-300">

      {/* ═══════════════════════════════════════════════
          HERO SECTION — Immersive Premium
         ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated gradient backdrop — light: soft mint, dark: deep green */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-emerald-950 dark:to-slate-900 transition-colors duration-500">
          {/* Floating orbs */}
          <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-emerald-200/40 dark:bg-emerald-500/20 rounded-full blur-[120px] animate-pulse transition-colors duration-500"></div>
          <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-teal-200/30 dark:bg-teal-400/15 rounded-full blur-[100px] animate-pulse transition-colors duration-500" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[50%] left-[40%] w-64 h-64 bg-emerald-100/30 dark:bg-emerald-300/10 rounded-full blur-[80px] animate-pulse transition-colors duration-500" style={{ animationDelay: '4s' }}></div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(16,185,129,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 py-20 md:py-28 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 dark:bg-white/10 backdrop-blur-md border border-emerald-500/20 dark:border-white/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-widest uppercase mb-8 transition-colors duration-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                #BerbagiItuIndah
              </div>
              <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-8 tracking-tight transition-colors duration-500">
                Berbagi Kebaikan
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent">Lewat Digital</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-lg leading-relaxed transition-colors duration-500">
                Platform amanah untuk menyalurkan infaq &amp; wakaf Anda. Ubah masa depan mereka dengan kontribusi nyata yang transparan dan terukur.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/explore" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 overflow-hidden">
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="relative">Mulai Berdonasi</span>
                  <span className="material-symbols-outlined text-[20px] relative group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
                <button onClick={() => setIsImpactOpen(true)} className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-emerald-300 dark:bg-white/10 backdrop-blur-md dark:border-white/20 dark:text-white font-bold text-lg rounded-2xl dark:hover:bg-white/20 transition-all duration-300">
                  <span className="material-symbols-outlined text-[22px] text-emerald-500 dark:text-emerald-400">play_circle</span>
                  Lihat Dampak
                </button>
              </div>

              {/* Trust Row */}
              <div className="flex items-center gap-6 mt-12 pt-8 border-t border-slate-200 dark:border-white/10">
                <div className="flex -space-x-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white ${['bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-emerald-300'][i]} flex items-center justify-center`}>
                      <span className="text-[10px] font-bold text-white">{'😊🤲💚✨'[i]}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white transition-colors duration-500">15,000+ Donatur</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-500">Sudah menyalurkan kebaikan</p>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:block animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="relative">
                {/* Main Card */}
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-black/40 border border-white/10">
                  <img
                    alt="Donasi InfaqLy"
                    loading="eager"
                    fetchpriority="high"
                    decoding="async"
                    width="500"
                    height="600"
                    className="w-full aspect-[4/5] object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtvLNhQLwSvJ39x5VIL3RdjIq7aIRowq59uuy8WHLxJLbsuJYRQb-wnxUfKG4QpoHhYNp1hgH0UtFv9-coaYSyRKtyWkaLuWPWCjHM9dhtslpu8Z2wk_8tH30MyMs89oljB-QbX6YydPjoQ4rv_hW-xMW0QJwzwaRrTgqTAurVy2pWuNmHX6Sumk9OWOlN5oRlehvw9XQZkIxq5pF0L36j_RXkloIbGT5T3joE9knYsdg0fOgz-hMkkpULym054L3WtPu9j4RPPa0=s600"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 dark:from-emerald-950/80 via-transparent to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          IMPACT STATS — Animated Counters
         ═══════════════════════════════════════════════ */}
      <ImpactStats totalCollected={totalCollected} totalDonors={totalDonors} totalPrograms={totalPrograms} />

      {/* ═══════════════════════════════════════════════
          MENGAPA INFAQLY — Trust Section
         ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6 sm:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <RevealOnScroll direction="up">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4 border border-emerald-500/20 hover:scale-105 transition-transform cursor-default">Kenapa Kami?</span>
              <h2 className="font-headline text-3xl md:text-5xl font-bold mb-4 dark:text-white hover:text-emerald-500 transition-colors cursor-default">Mengapa Memilih <span className="text-primary dark:text-emerald-400">infaqLy</span>?</h2>
              <p className="text-on-surface-variant dark:text-slate-400 text-lg max-w-2xl mx-auto">Platform kami dirancang dengan prinsip keamanan, transparansi, dan kemudahan untuk memberikan pengalaman berdonasi terbaik.</p>
            </div>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'shield', title: 'Aman & Terpercaya', desc: 'Dilindungi enkripsi end-to-end dan sistem keamanan berlapis.', color: 'emerald' },
              { icon: 'speed', title: 'Proses Instan', desc: 'Donasi tersalurkan secara real-time tanpa perlu menunggu lama.', color: 'teal' },
              { icon: 'visibility', title: '100% Transparan', desc: 'Pantau penggunaan dana secara real-time dari dashboard Anda.', color: 'cyan' },
              { icon: 'devices', title: 'Multi-Platform', desc: 'Akses dari mana saja — desktop, tablet, atau smartphone.', color: 'emerald' },
            ].map((item, i) => (
              <RevealOnScroll key={i} delay={i * 150} direction="up">
                <div className="group bg-white dark:bg-slate-800/60 backdrop-blur-sm p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700/60 hover:border-transparent transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20 relative overflow-hidden cursor-pointer h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/10 group-hover:to-transparent rounded-full blur-2xl -mr-16 -mt-16 transition-all duration-700"></div>
                  <div className={`w-14 h-14 rounded-2xl bg-${item.color}-500/10 dark:bg-${item.color}-500/15 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10`}>
                    <span className={`material-symbols-outlined text-${item.color}-600 dark:text-${item.color}-400 text-[28px]`}>{item.icon}</span>
                  </div>
                  <h3 className="font-headline text-lg font-bold mb-3 dark:text-white relative z-10 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                  <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed relative z-10">{item.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PROGRAM UNGGULAN — Featured Campaigns
         ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6 sm:px-8 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div className="max-w-xl">
              <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4 border border-emerald-500/20">Program Pilihan</span>
              <h2 className="font-headline text-3xl md:text-5xl font-bold mb-4 dark:text-white">Program Unggulan</h2>
              <p className="text-on-surface-variant dark:text-slate-300 text-lg">Pilih program yang paling sesuai dengan kepedulian Anda dan mulailah menebar manfaat hari ini.</p>
            </div>
            <Link to="/explore" className="group flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg hover:gap-3 transition-all">
              Lihat Semua <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-lg h-[460px] animate-pulse">
                  <div className="h-56 bg-slate-200 dark:bg-slate-700 w-full"></div>
                  <div className="p-8 flex flex-col gap-4">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-full"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map((campaign, idx) => (
                <CampaignCardHome key={campaign.id} campaign={campaign} idx={idx} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-6xl mb-4 text-slate-300 dark:text-slate-600">campaign</span>
              <p className="text-lg">Belum ada program aktif saat ini</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CARA BERDONASI — Steps
         ═══════════════════════════════════════════════ */}
      <section id="cara-donasi" className="py-12 px-6 sm:px-8 transition-colors overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <RevealOnScroll direction="scale">
            <div className="text-center mb-20">
              <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4 border border-emerald-500/20 hover:scale-105 transition-transform cursor-default">Panduan</span>
              <h2 className="font-headline text-3xl md:text-5xl font-bold mb-4 text-on-surface dark:text-white">Cara Mudah <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">Berdonasi</span></h2>
              <p className="text-on-surface-variant dark:text-slate-400 text-lg max-w-2xl mx-auto">Hanya butuh beberapa langkah untuk memberikan dampak bagi sesama.</p>
            </div>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: 'search', title: 'Pilih Program', desc: 'Cari program yang ingin Anda bantu melalui halaman jelajahi.', num: '01' },
              { icon: 'credit_score', title: 'Pilih Nominal', desc: 'Masukkan jumlah donasi sesuai dengan kemampuan Anda.', num: '02' },
              { icon: 'payments', title: 'Bayar Donasi', desc: 'Gunakan berbagai metode pembayaran digital yang tersedia.', num: '03' },
              { icon: 'receipt_long', title: 'Terima Laporan', desc: 'Dapatkan update berkala mengenai penggunaan dana donasi.', num: '04' },
            ].map((step, i) => (
              <RevealOnScroll key={i} delay={i * 200} direction="left">
                <div className="relative group text-center cursor-default pt-4">
                  <div className="relative mb-8">
                    <span className="absolute -top-6 -left-2 text-[4.5rem] font-headline font-black text-emerald-500/10 dark:text-emerald-400/10 leading-none select-none group-hover:text-emerald-500/20 transition-colors duration-500">{step.num}</span>
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/5 border border-slate-100 dark:border-slate-700 transition-all duration-500 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-500 group-hover:text-white group-hover:-translate-y-3 group-hover:shadow-2xl group-hover:shadow-emerald-500/30">
                      <span className="material-symbols-outlined text-[32px]">{step.icon}</span>
                    </div>
                  </div>
                  <h4 className="font-bold text-lg mb-2 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{step.title}</h4>
                  <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed max-w-[200px] mx-auto">{step.desc}</p>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-12 -right-4 text-slate-200 dark:text-slate-800 group-hover:text-emerald-300 dark:group-hover:text-emerald-700 transition-colors group-hover:translate-x-2 duration-300">
                      <span className="material-symbols-outlined text-[28px]">chevron_right</span>
                    </div>
                  )}
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA SECTION — Premium Gradient
         ═══════════════════════════════════════════════ */}
      <section className="w-full bg-gradient-to-b from-white via-emerald-50/60 to-emerald-100/40 dark:from-transparent dark:via-transparent dark:to-transparent pt-10 pb-16 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-500/25 dark:shadow-emerald-900/40">
            {/* Bg gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700"></div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full -ml-48 -mb-48 blur-3xl"></div>
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            <div className="relative z-10 p-12 md:p-16 lg:p-20 text-center">
              <h2 className="font-headline text-3xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto text-white leading-tight">Wujudkan Dampak Nyata Hari Ini</h2>
              <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">Bergabunglah dengan ribuan donatur lainnya dalam menebar kebaikan yang terukur dan transparan.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {!isAuthenticated ? (
                  <Link to="/register" className="group bg-white text-emerald-700 px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2">
                    Daftar Sekarang <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </Link>
                ) : (
                  <Link to="/profile" className="group bg-white text-emerald-700 px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2">
                    Dashboard Anda <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </Link>
                )}
                <Link to="/explore" className="bg-white/15 backdrop-blur-md border border-white/25 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/25 transition-all inline-flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">explore</span> Jelajahi Program
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* Soft bottom blend — gradient fades into white */}
        <div className="h-12 bg-gradient-to-b from-emerald-100/40 to-white dark:from-transparent dark:to-transparent mt-0 transition-colors duration-500"></div>
      </section>

      {/* Impact Modal */}
      {isImpactOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in" onClick={() => setIsImpactOpen(false)}>
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-scale-in relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsImpactOpen(false)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="aspect-video w-full bg-slate-200 dark:bg-slate-700">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/P6bH3sP0FkI?autoplay=1&mute=1"
                title="Dampak Donasi"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-on-surface dark:text-white mb-2">Dampak Nyata Kebaikan Anda</h3>
              <p className="text-on-surface-variant dark:text-slate-400 mb-6 leading-relaxed">Ribuan senyum telah tercipta berkat gotong royong dan uluran tangan dari para donatur InfaqLy.</p>
              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-700 pt-6">
                <div className="text-center">
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">15K+</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Penerima</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-teal-600 dark:text-teal-400 mb-1">420</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Program</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">100%</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tersalurkan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ Impact Stats Component with Animated Counters ═══
function ImpactStats({ totalCollected, totalDonors, totalPrograms }) {
  const collected = useCountUp(Math.round(totalCollected / 1_000_000_000), 2500);
  const donors = useCountUp(totalDonors >= 1000 ? Math.round(totalDonors / 1000) : totalDonors, 2000);
  const programs = useCountUp(totalPrograms, 1800);

  return (
    <section className="py-20 px-6 sm:px-8 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div ref={collected.ref} className="text-center group">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[32px]">account_balance_wallet</span>
            </div>
            <h3 className="text-5xl md:text-6xl font-headline font-black text-on-surface dark:text-white mb-2">{collected.count}<span className="text-emerald-500">M+</span></h3>
            <p className="text-on-surface-variant dark:text-slate-400 font-semibold">Total Terkumpul</p>
          </div>
          <div ref={donors.ref} className="text-center group">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[32px]">group</span>
            </div>
            <h3 className="text-5xl md:text-6xl font-headline font-black text-on-surface dark:text-white mb-2">{donors.count}<span className="text-emerald-500">{totalDonors >= 1000 ? 'K+' : '+'}</span></h3>
            <p className="text-on-surface-variant dark:text-slate-400 font-semibold">Total Donatur</p>
          </div>
          <div ref={programs.ref} className="text-center group">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[32px]">volunteer_activism</span>
            </div>
            <h3 className="text-5xl md:text-6xl font-headline font-black text-on-surface dark:text-white mb-2">{programs.count}<span className="text-emerald-500">+</span></h3>
            <p className="text-on-surface-variant dark:text-slate-400 font-semibold">Program Aktif</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══ Campaign Card Component ═══
function CampaignCardHome({ campaign, idx }) {
  const progress = campaign.target > 0 ? Math.round((campaign.collected / campaign.target) * 100) : 0;
  const days = daysRemaining(campaign.endDate);
  const categoryLabel = campaign.category === 'infaq' ? 'Infaq' : campaign.category === 'wakaf' ? 'Wakaf' : campaign.category;

  const tagColors = [
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  ];
  const tagColorClass = tagColors[idx % 3];

  const rawImageUrl = campaign.imageUrl || campaign.image;
  const hasValidImage = rawImageUrl && typeof rawImageUrl === 'string' && rawImageUrl.length > 5 && rawImageUrl !== 'null' && rawImageUrl !== 'undefined';
  const displayImageUrl = hasValidImage
    ? optimizeImageUrl(rawImageUrl, 400)
    : 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&h=250&fit=crop&fm=webp&q=75';

  return (
    <Link to={`/explore/${campaign.id}`} className="group bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/60 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all block">
      <div className="relative h-56 overflow-hidden">
        <img
          src={displayImageUrl}
          alt={campaign.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            if (e.target.src !== 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&h=250&fit=crop&fm=webp&q=75') {
              e.target.src = 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&h=250&fit=crop&fm=webp&q=75';
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        <div className={`absolute top-4 left-4 ${tagColorClass} text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-md border bg-white/80 dark:bg-slate-900/80`}>
          {categoryLabel}
        </div>
      </div>
      <div className="p-7">
        <h3 className="font-headline text-lg font-bold mb-4 line-clamp-2 text-on-surface dark:text-white h-14 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{campaign.title}</h3>
        <div className="mb-5">
          <div className="flex justify-between text-xs font-bold mb-2.5">
            <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(campaign.collected)}</span>
            <span className="text-slate-500 dark:text-slate-400">Target: {formatCurrencyShort(campaign.target)}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
        </div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-slate-400">group</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{campaign.donors} donatur</span>
          </div>
          {progress >= 100 ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> Tercapai!</span>
          ) : days <= 0 ? (
            <span className="text-xs text-red-500 dark:text-red-400 font-bold">Ditutup</span>
          ) : (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{days} Hari Lagi</span>
          )}
        </div>
        <div className="w-full py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold rounded-2xl transition-all group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:bg-emerald-500 dark:group-hover:text-white text-center text-sm border border-emerald-100 dark:border-emerald-500/20 group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-emerald-500/20">
          Donasi Sekarang
        </div>
      </div>
    </Link>
  );
}
