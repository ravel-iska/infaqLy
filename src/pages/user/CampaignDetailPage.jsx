import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Clock, Heart } from 'lucide-react';
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
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [amount, setAmount] = useState('');
  const [selectedQuick, setSelectedQuick] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [donorMessage, setDonorMessage] = useState('');
  const [recentDonors, setRecentDonors] = useState([]);

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
      <div className="flex items-center justify-center py-20">
        <span className="text-4xl animate-pulse">🕌</span>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="animate-fade-in py-20 text-center">
        <p className="text-6xl mb-4">😢</p>
        <h2 className="text-xl font-bold text-user-text">Program tidak ditemukan</h2>
        <p className="text-user-text-secondary mt-2">Program yang Anda cari mungkin sudah berakhir atau dihapus.</p>
        <Link to="/explore" className="btn-user-primary mt-6 inline-flex">
          <ArrowLeft size={16} /> Kembali ke Jelajahi
        </Link>
      </div>
    );
  }

  const progress = campaign.target > 0 ? Math.round((campaign.collected / campaign.target) * 100) : 0;
  const days = daysRemaining(campaign.endDate);
  const categoryLabel = campaign.category === 'infaq' ? 'Infaq' : 'Wakaf';

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

        // Buka Snap Popup — status diupdate otomatis via Midtrans webhook
        await openSnapPopup(data.token, {
          onSuccess: () => {
            toast.success('Pembayaran berhasil! Jazakallahu khairan 🤲', { duration: 5000 });
            // Status otomatis diupdate oleh Midtrans webhook → backend
          },
          onPending: () => {
            toast.success('Pembayaran dalam proses. Silakan selesaikan pembayaran Anda.', { duration: 5000 });
            // Midtrans akan kirim webhook saat user bayar atau expired
          },
          onClose: () => {
            toast('Pembayaran dibatalkan — status tetap pending sampai expired', { icon: 'ℹ️' });
          },
        });
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

  return (
    <div className="animate-fade-in py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/explore" className="inline-flex items-center gap-2 text-sm text-user-text-secondary hover:text-user-accent mb-6 transition-colors">
          <ArrowLeft size={16} /> Kembali ke Jelajahi
        </Link>

        {/* Hero Image */}
        <div className="rounded-2xl overflow-hidden mb-8">
          <img
            src={campaign.image || 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800&h=400&fit=crop'}
            alt={campaign.title}
            className="w-full h-64 sm:h-80 lg:h-96 object-cover"
          />
        </div>

        {/* Content Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — Description */}
          <div className="lg:w-3/5">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${campaign.category === 'infaq' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {categoryLabel}
              </span>
              <span className="text-sm text-user-text-muted">{days} hari lagi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-user-text">{campaign.title}</h1>
            <div
              className="mt-6 prose prose-sm max-w-none text-user-text-secondary leading-relaxed
                [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-user-text [&_h2]:mt-6 [&_h2]:mb-3"
              dangerouslySetInnerHTML={{ __html: campaign.description || '<p>Deskripsi belum tersedia.</p>' }}
            />
          </div>

          {/* Right — Donation Sticky Card */}
          <div className="lg:w-2/5">
            <div className="lg:sticky lg:top-24">
              <div className="user-card p-6">
                <p className="text-sm text-user-text-secondary mb-1">Dana Terkumpul</p>
                <p className="text-2xl font-bold text-user-accent">{formatCurrency(campaign.collected)}</p>
                <p className="text-sm text-user-text-muted">dari {formatCurrency(campaign.target)}</p>
                <div className="progress-bar mt-3">
                  <div className="progress-bar-fill" style={{ '--progress-width': `${Math.min(progress, 100)}%` }}></div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-user-text-muted">
                  <span>{progress}%</span>
                </div>

                <div className="flex gap-4 mt-4 pt-4 border-t border-user-border">
                  <div className="flex items-center gap-1.5 text-sm text-user-text-secondary">
                    <Users size={16} className="text-user-accent" />
                    {campaign.donors} donatur
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-user-text-secondary">
                    <Clock size={16} className="text-warning" />
                    {days} hari lagi
                  </div>
                </div>

                {/* Donation Form */}
                <div className="mt-6 pt-6 border-t border-user-border">
                  <label className="block text-sm font-medium text-user-text mb-2">Nominal Donasi</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-user-text-muted text-sm font-medium">Rp</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); setSelectedQuick(null); }}
                      placeholder="50.000"
                      className="input-user pl-10"
                      min={MIN_DONATION}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {QUICK_AMOUNTS.map((q) => (
                      <button
                        key={q.value}
                        onClick={() => handleQuickAmount(q.value)}
                        className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                          selectedQuick === q.value
                            ? 'bg-user-accent text-white border-user-accent'
                            : 'bg-white text-user-text-secondary border-user-border hover:border-user-accent hover:text-user-accent'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded border-user-border text-user-accent focus:ring-user-accent"
                    />
                    <span className="text-sm text-user-text-secondary">Donasi sebagai Anonim</span>
                  </label>

                  <button onClick={handleDonate} disabled={payLoading} className="btn-user-primary w-full mt-4 py-3.5 text-base">
                    {payLoading ? (
                      <span className="animate-pulse">Memproses...</span>
                    ) : (
                      <><Heart size={18} className="fill-white" /> Donasi Sekarang</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Donors */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-user-text mb-4">Donatur Terbaru</h2>
          <div className="user-card divide-y divide-user-border">
            {recentDonors.length === 0 ? (
              <div className="px-5 py-8 text-center text-user-text-muted text-sm">Belum ada donatur</div>
            ) : recentDonors.map((donor, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-user-accent-light flex items-center justify-center">
                    <span className="text-sm font-semibold text-user-accent">{(donor.isAnonymous ? 'H' : donor.donorName?.[0]) || '?'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-user-text">{donor.isAnonymous ? 'Hamba Allah' : donor.donorName}</p>
                    <p className="text-xs text-user-text-muted">{formatTimeAgo(donor.createdAt)}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-user-accent">{formatCurrency(donor.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
