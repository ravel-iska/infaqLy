import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { QUICK_AMOUNTS, MIN_DONATION } from '@/utils/constants';
import { formatTimeAgo } from '@/utils/formatDate';
import { getCampaignById, daysRemaining } from '@/services/campaignService';
import { openSnapPopup, loadSnapScript } from '@/services/midtrans';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function CampaignDetailPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [amount, setAmount] = useState('');
  const [selectedQuick, setSelectedQuick] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [recentDonors, setRecentDonors] = useState([]);

  // Modal States
  const [showThankYou, setShowThankYou] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingOrderId, setPendingOrderId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCampaignById(campaignId);
        setCampaign(data);
      } catch { setCampaign(null); }
      setLoading(false);
      // Load recent donors
      try {
        const donorsData = await api.get(`/campaigns/${campaignId}/donors`);
        setRecentDonors(donorsData.donors || []);
      } catch {}
    }
    load();
    // Pre-load Snap.js (client key fetched from DB via backend)
    loadSnapScript();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="animate-fade-in py-32 text-center flex flex-col items-center">
        <span className="material-symbols-outlined text-[80px] text-slate-300 dark:text-slate-600 mb-4 block">sentiment_dissatisfied</span>
        <h2 className="text-3xl font-bold text-on-surface dark:text-white font-headline">Program Tidak Ditemukan</h2>
        <p className="text-on-surface-variant dark:text-slate-400 mt-3 mb-8">Maaf, program yang Anda cari mungkin sudah ditutup atau dihapus.</p>
        <Link to="/explore" className="bg-primary dark:bg-emerald-600 hover:bg-primary/90 dark:hover:bg-emerald-500 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Jelajahi
        </Link>
      </div>
    );
  }

  const progress = campaign.target > 0 ? Math.round((campaign.collected / campaign.target) * 100) : 0;
  const days = daysRemaining(campaign.endDate);
  const categoryLabel = campaign.category === 'infaq' ? 'Infaq' : campaign.category === 'wakaf' ? 'Wakaf' : campaign.category;

  const handleQuickAmount = (val) => {
    setSelectedQuick(val);
    setAmount(val.toString());
  };

  const handleDonate = async () => {
    const value = parseInt(amount);
    if (!value || value < MIN_DONATION) {
      toast.error(`Minimal donasi ${formatCurrency(MIN_DONATION)}`);
      return;
    }

    setPayLoading(true);
    try {
      // Backend creates Snap token + saves donation to DB (status: pending)
      const data = await api.post('/payment/create-token', {
        campaignId: campaign.id,
        amount: value,
        isAnonymous,
      });

      if (data.token) {
        await loadSnapScript();

        // Buka Snap Popup
        const snapResult = await openSnapPopup(data.token, {
          onSuccess: () => {
            // Kita sudah sukses
          },
          onPending: () => {
            // Pending status
          },
          onClose: () => {
            // User closed the popup manually
          },
        });

        // After popup closes, poll Midtrans for real status and update DB
        let finalStatus = snapResult.status;
        if (data.orderId) {
          try {
            // Add a cache buster timestamp so the browser NEVER caches the API response
            const res = await api.get(`/payment/check-status/${data.orderId}?t=${Date.now()}`);
            finalStatus = res.status;
          } catch (e) {
            toast.error("Gagal verifikasi Sandbox: " + (e.message || "Unknown ERROR"));
          }
        }

        // Logic based on final status
        if (finalStatus === 'success' || finalStatus === 'settlement' || finalStatus === 'capture') {
          setShowThankYou(true);
        } else if (finalStatus === 'pending' || finalStatus === 'closed') {
          // If they closed popup without paying but order is pending/closed
          setPendingToken(data.token);
          setPendingOrderId(data.orderId);
          setShowContinueModal(true);
        }

      } else if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setPayLoading(false);
    }
  };

  const handleContinuePayment = async () => {
    setShowContinueModal(false);
    if (!pendingToken) return;

    try {
      await loadSnapScript();
      const snapResult = await openSnapPopup(pendingToken, {
        onSuccess: () => {},
        onPending: () => {},
        onClose: () => {},
      });

      let finalStatus = snapResult.status;
      if (pendingOrderId) {
        try {
          const res = await api.get(`/payment/check-status/${pendingOrderId}?t=${Date.now()}`);
          finalStatus = res.status;
        } catch {}
      }

      if (finalStatus === 'success' || finalStatus === 'settlement' || finalStatus === 'capture') {
        setShowThankYou(true);
      } else if (finalStatus === 'pending' || finalStatus === 'closed') {
        setShowContinueModal(true); // User closed it again without paying
      }
    } catch (error) {
      toast.error('Token pembayaran sudah kedaluwarsa. Silakan berdonasi lagi.');
    }
  };

  return (
    <div className="animate-fade-in py-6">
      <main className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs font-medium text-on-surface-variant/60 dark:text-slate-500 mb-6 uppercase tracking-widest">
          <Link to="/explore" className="hover:text-primary dark:hover:text-emerald-400 transition-colors">Program</Link>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="dark:text-slate-400">{categoryLabel}</span>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-primary dark:text-emerald-400 font-bold">Detail</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Content: Program Description & Details */}
          <div className="lg:col-span-8 space-y-10">
            {/* Hero Image Container */}
            <div className="relative w-full aspect-[16/9] rounded-[2rem] overflow-hidden bg-surface-container-highest shadow-ambient">
              <img 
                className="w-full h-full object-cover" 
                alt={campaign.title} 
                src={campaign.image || 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800&h=400&fit=crop'}
              />
              <div className="absolute bottom-6 left-6 flex flex-wrap gap-2">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/30">
                  {categoryLabel}
                </span>
                {days < 7 && days > 0 && (
                  <span className="px-4 py-2 bg-emerald-500/80 backdrop-blur-md text-white text-xs font-bold rounded-full">
                    Kebutuhan Mendesak
                  </span>
                )}
              </div>
            </div>

            {/* Program Header */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface dark:text-white leading-tight tracking-tight font-headline">
                {campaign.title}
              </h1>
              <div className="flex items-center space-x-4 pt-2">
                <div className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-slate-800 flex items-center justify-center text-primary dark:text-emerald-400 overflow-hidden border border-outline-variant/30 dark:border-slate-700">
                  <span className="material-symbols-outlined">account_balance</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400 font-medium">Penggalang Dana</p>
                  <p className="text-sm font-bold text-on-surface dark:text-slate-200">Yayasan InfaqLy Berkah</p>
                </div>
                <div className="h-6 w-px bg-outline-variant/30 dark:bg-slate-700 mx-2"></div>
                <div className="flex items-center text-primary dark:text-emerald-400 text-xs font-bold bg-primary/10 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-[14px] mr-1">verified</span>
                  Verifikasi Resmi
                </div>
              </div>
            </div>

            {/* Bento Grid Content Section */}
            <div className="grid grid-cols-1 gap-6">
              <div className="p-8 rounded-[1.5rem] bg-surface-container-low dark:bg-slate-800 border border-outline-variant/10 dark:border-slate-700 shadow-sm">
                <h3 className="text-xl font-bold mb-4 text-on-surface dark:text-slate-100 font-headline">Tentang Program</h3>
                <div 
                  className="text-on-surface-variant dark:text-slate-300 leading-relaxed text-sm prose prose-sm dark:prose-invert max-w-none 
                    [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-on-surface dark:[&_h2]:text-slate-100 [&_h2]:mt-6 [&_h2]:mb-3 [&_strong]:text-on-surface dark:[&_strong]:text-slate-200"
                  dangerouslySetInnerHTML={{ __html: campaign.description || '<p>Detail deskripsi belum tersedia.</p>' }}
                />
              </div>
            </div>

          </div>

          {/* Right Sidebar: Donation Panel */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              {/* Progress Card */}
              <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-2xl shadow-on-surface/5 dark:shadow-black/20 border border-outline-variant/20 dark:border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary dark:from-emerald-500 to-secondary-container dark:to-emerald-800"></div>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-3xl font-extrabold text-primary dark:text-emerald-400 tracking-tight">{formatCurrency(campaign.collected)}</p>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Terkumpul dari target <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(campaign.target)}</strong></p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white bg-primary dark:bg-emerald-600 px-2.5 py-1 rounded-lg">
                        {progress}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-surface-container dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-primary dark:bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" style={{ width: `${Math.min(progress, 100)}%` }}>
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-on-surface-variant dark:text-slate-400 font-medium pt-3">
                    <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                      <span className="material-symbols-outlined text-[14px] mr-1.5 text-primary dark:text-emerald-400">group</span>
                      {campaign.donors} Pahlawan Kebaikan
                    </div>
                    <div className="flex items-center text-slate-500 dark:text-slate-500">
                      <span className="material-symbols-outlined text-[14px] mr-1.5">schedule</span>
                      {days > 0 ? `${days} Hari Tersisa` : 'Waktu Habis'}
                    </div>
                  </div>
                </div>

                {/* Donation Options Panel */}
                <div className="mt-8 pt-6 border-t border-outline-variant/10 dark:border-slate-700 relative">
                  
                  {/* AUTH BARRIER OVERLAY (GLASSMORPHISM) */}
                  {!user && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pt-8">
                      {/* Blurred backdrop hiding the bottom area */}
                      <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/60 backdrop-blur-[4px] rounded-b-[2rem] -mx-8 -mb-8 pointer-events-auto"></div>
                      
                      {/* Floating Card */}
                      <div className="relative z-30 bg-white/95 dark:bg-slate-800/95 p-6 rounded-[1.5rem] shadow-2xl shadow-primary/20 dark:shadow-black/50 border border-white/50 dark:border-slate-600 text-center mx-1 backdrop-blur-md transform transition-all hover:scale-[1.02] border-t-emerald-500 dark:border-t-emerald-400 border-t-4">
                        <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-3">
                          <span className="material-symbols-outlined text-[32px] text-emerald-600 dark:text-emerald-400">volunteer_activism</span>
                        </div>
                        <h4 className="font-extrabold text-on-surface dark:text-slate-100 mb-2 font-headline text-lg">Hampir Sampai!</h4>
                        <p className="text-sm text-on-surface-variant dark:text-slate-300 font-medium mb-5 leading-relaxed">
                          Satu langkah kecil lagi. Silakan <strong className="text-emerald-600 dark:text-emerald-400">Daftar</strong> atau <strong className="text-emerald-600 dark:text-emerald-400">Masuk</strong> sejenak untuk melanjutkan niat baik ini dengan aman dan transparan.
                        </p>
                        <div className="flex flex-col gap-2.5">
                          <Link to="/login" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold shadow-lg hover:shadow-xl transition-all block text-[15px]">
                            Masuk & Lanjut Bayar
                          </Link>
                          <Link to="/register" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mt-2">
                            Belum punya akun? Daftar gratis
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACTUAL PAYMENT FIELD (Always rendered, but looks disabled/blurred if not logged in) */}
                  <div className={`space-y-4 pt-2 transition-all duration-500 ease-out ${!user ? 'opacity-30 select-none pointer-events-none blur-[2px] grayscale-[30%]' : ''}`}>
                    <h4 className="text-sm font-bold text-on-surface dark:text-slate-200 tracking-tight">Pilih Nominal Infaq Anda</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {QUICK_AMOUNTS.map((q) => (
                        <button
                          key={q.value}
                          onClick={() => handleQuickAmount(q.value)}
                          className={`py-3 px-2 rounded-xl text-xs font-bold transition-all ${
                            selectedQuick === q.value
                              ? "bg-primary dark:bg-emerald-600 border border-primary dark:border-emerald-500 text-white shadow-md transform scale-[1.02]"
                              : "bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-700 hover:border-primary/50 dark:hover:border-emerald-500/50 hover:bg-primary-container/5 dark:hover:bg-emerald-900/20 text-on-surface dark:text-slate-300"
                          }`}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                    
                    <div className="mt-3 relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm group-focus-within:text-primary dark:group-focus-within:text-emerald-400 transition-colors">Rp</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => { setAmount(e.target.value); setSelectedQuick(null); }}
                        placeholder="Nominal Lain (Min. 10.000)"
                        className="w-full bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/40 dark:border-slate-600 text-on-surface dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/30 focus:border-primary dark:focus:border-emerald-500 transition-all font-bold"
                        min={MIN_DONATION}
                      />
                    </div>

                    <label className="flex items-center gap-3 mt-4 pt-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="peer w-5 h-5 appearance-none rounded border-2 border-slate-300 dark:border-slate-500 checked:border-primary dark:checked:border-emerald-500 checked:bg-primary dark:checked:bg-emerald-500 transition-colors cursor-pointer"
                        />
                        <span className="material-symbols-outlined text-[14px] text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity">check</span>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-medium group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">Sembunyikan nama saya (Hamba Allah)</span>
                    </label>

                    <button 
                      onClick={handleDonate} 
                      disabled={payLoading}
                      className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-primary dark:from-emerald-600 to-primary-fixed dark:to-emerald-500 text-white font-bold text-base shadow-xl shadow-primary/30 dark:shadow-emerald-900/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                    >
                      {payLoading ? <><Loader2 size={20} className="animate-spin" /> Memproses...</> : <>
                        Salurkan Kebaikan <span className="material-symbols-outlined text-[18px]">favorite</span>
                      </>}
                    </button>
                  </div>
                </div>

                {/* Trust Badge */}
                <div className="mt-8 pt-6 border-t border-outline-variant/10 dark:border-slate-700 flex items-start space-x-3 bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-xl border border-transparent dark:border-slate-700/50">
                  <span className="material-symbols-outlined text-primary-container dark:text-emerald-500">verified_user</span>
                  <div>
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-0.5">Sistem Enkripsi 256-bit</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-relaxed">Donasi Anda diproses ultra aman menggunakan teknologi Payment Gateway standar Bank Indonesia.</p>
                  </div>
                </div>
              </div>

              {/* Share Section */}
              <div className="p-6 rounded-[1.5rem] bg-secondary-container/10 dark:bg-slate-800 border border-secondary-container/30 dark:border-slate-700 flex flex-col justify-center items-center text-center gap-3">
                <p className="text-sm font-bold text-on-secondary-container dark:text-slate-300">Informasi ini berharga. Ajak kerabat Anda berbuat baik dengan membagikannya.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Tautan berhasil disalin ke clipboard!');
                    }}
                    className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-primary dark:text-emerald-400 shadow-sm hover:bg-primary dark:hover:bg-emerald-600 hover:text-white dark:hover:text-white hover:scale-110 transition-all border border-primary/10 dark:border-slate-600"
                    title="Salin Tautan"
                  >
                    <span className="material-symbols-outlined text-[18px]">link</span>
                  </button>
                  <a 
                    href={`https://wa.me/?text=Mari%20berdonasi%20melalui%20InfaqLy%3A%20${window.location.href}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm hover:scale-110 transition-all"
                    title="Bagikan ke WhatsApp"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Donors Section — outside grid so it always appears after payment panel on mobile */}
        <section className="space-y-6 mt-10 max-w-7xl">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-extrabold tracking-tight font-headline dark:text-white">Donatur Terbaru</h2>
            <span className="text-sm font-bold text-primary dark:text-emerald-400 px-3 py-1 bg-primary/10 dark:bg-emerald-900/30 rounded-lg">{recentDonors.length} Orang</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentDonors.length === 0 ? (
              <div className="col-span-full text-center text-on-surface-variant dark:text-slate-400 text-sm py-12 bg-surface-container-lowest dark:bg-slate-800 rounded-2xl border border-outline-variant/10 dark:border-slate-700 border-dashed">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 block mb-2">volunteer_activism</span>
                Belum ada donatur, mari menjadi pionir kebaikan!
              </div>
            ) : recentDonors.map((donor, i) => {
              const initials = donor.isAnonymous ? 'HA' : (donor.donorName?.[0] || '?');
              const isLarge = donor.amount >= 250000;
              
              return (
                <div key={i} className="flex items-center space-x-4 p-4 rounded-2xl bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/10 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${isLarge ? 'bg-primary-container/20 dark:bg-emerald-900/40 text-primary dark:text-emerald-400' : 'bg-surface-container-high dark:bg-slate-700 text-primary-container dark:text-emerald-500'}`}>
                    {initials}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h4 className="font-bold text-sm text-on-surface dark:text-slate-200 truncate">
                      {donor.isAnonymous ? 'Hamba Allah' : donor.donorName}
                    </h4>
                    <p className="text-xs text-on-surface-variant dark:text-slate-400">Donasi <span className="font-semibold text-primary dark:text-emerald-400">{formatCurrency(donor.amount)}</span></p>
                  </div>
                  <div className="text-[10px] text-on-surface-variant/60 dark:text-slate-500 font-medium whitespace-nowrap">
                    {formatTimeAgo(donor.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden transform transition-all scale-100 animate-slide-up">
            <div className="mx-auto w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[50px] text-emerald-500 dark:text-emerald-400">check_circle</span>
            </div>
            
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2 font-headline">Jazakallahu Khairan!</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Kebaikan Anda senilai <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(parseInt(amount))}</strong> telah berhasil disalurkan. 
              Semoga Allah lipat gandakan rezeki dan memberkahi Anda beserta keluarga. Amin.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  setShowThankYou(false);
                  navigate('/profile');
                }}
                className="w-full py-3.5 bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all"
              >
                Lihat Sertifikat Donasi
              </button>
              <button 
                onClick={() => setShowThankYou(false)}
                className="w-full py-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Continue Transaction Modal */}
      {showContinueModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden transform transition-all scale-100 animate-slide-up">
            <div className="mx-auto w-20 h-20 bg-amber-100 dark:bg-amber-900/30 border border-amber-500/20 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[40px] text-amber-500 dark:text-amber-400">pause_circle</span>
            </div>
            
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2 font-headline">Transaksi Tertunda</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              Anda menutup halaman sebelum menyelesaikan pembayaran. Apakah Anda ingin melanjutkan transaksi ini?
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleContinuePayment}
                className="w-full py-3.5 bg-primary dark:bg-emerald-600 hover:bg-primary/90 dark:hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">payment</span>
                Ya, Lanjutkan Bayar
              </button>
              <button 
                onClick={() => setShowContinueModal(false)}
                className="w-full py-3.5 bg-transparent border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold rounded-xl transition-all"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
