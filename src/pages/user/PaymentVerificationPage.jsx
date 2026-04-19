import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatCurrency';
import api from '@/services/api';

export default function PaymentVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  const [status, setStatus] = useState('checking'); // checking | success | pending | failed | expired | error
  const [donation, setDonation] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      return;
    }

    const checkStatus = async () => {
      try {
        // First try to check status via gateway API (triggers webhook-like update)
        await api.get(`/midtrans/check-status/${orderId}`).catch(() => {});

        // Then fetch the donation record
        const res = await api.get(`/donations/${orderId}`);
        const d = res.donation;
        if (!d) {
          setStatus('error');
          return;
        }

        setDonation(d);

        // Load campaign info
        if (d.campaignId) {
          try {
            const campRes = await api.get(`/campaigns/${d.campaignId}`);
            setCampaign(campRes);
          } catch {}
        }

        if (d.paymentStatus === 'success') {
          setStatus('success');
          clearInterval(pollRef.current);
        } else if (d.paymentStatus === 'failed') {
          setStatus('failed');
          clearInterval(pollRef.current);
        } else if (d.paymentStatus === 'expired') {
          setStatus('expired');
          clearInterval(pollRef.current);
        } else {
          setStatus('pending');
        }
      } catch (err) {
        console.error('[PaymentVerification] Error:', err);
        setStatus('error');
      }

      setPollCount(prev => prev + 1);
    };

    // Check immediately
    checkStatus();

    // Poll every 5 seconds for up to 60 attempts (5 minutes)
    pollRef.current = setInterval(() => {
      setPollCount(prev => {
        if (prev >= 60) {
          clearInterval(pollRef.current);
          return prev;
        }
        checkStatus();
        return prev;
      });
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [orderId]);

  // No orderId provided
  if (!orderId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 animate-fade-in">
        <span className="material-symbols-outlined text-[80px] text-error/40 mb-4">error</span>
        <h1 className="text-2xl font-bold text-on-surface dark:text-white mb-2">Link Tidak Valid</h1>
        <p className="text-on-surface-variant dark:text-slate-400 mb-8">Order ID tidak ditemukan pada URL.</p>
        <Link to="/explore" className="btn-primary-custom">
          <span className="material-symbols-outlined text-[18px] mr-1">arrow_back</span>
          Kembali ke Jelajahi
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="w-full max-w-md">
        {/* ── Checking ── */}
        {status === 'checking' && (
          <div className="text-center">
            <div className="relative mx-auto mb-8 w-20 h-20">
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-primary/20 dark:border-emerald-500/20" />
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-primary dark:border-t-emerald-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-on-surface dark:text-white mb-2 font-headline">Memverifikasi Pembayaran</h1>
            <p className="text-on-surface-variant dark:text-slate-400">Mohon tunggu, kami sedang mengecek status transaksi Anda...</p>
          </div>
        )}

        {/* ── Success ── */}
        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-success/10 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce-in">
              <span className="material-symbols-outlined text-[56px] text-success dark:text-emerald-400">check_circle</span>
            </div>
            <h1 className="text-3xl font-bold text-on-surface dark:text-white mb-2 font-headline">Pembayaran Berhasil!</h1>
            <p className="text-on-surface-variant dark:text-slate-400 mb-6">Jazakallahu Khairan. Donasi Anda telah kami terima.</p>
            
            {donation && (
              <div className="bg-base-100 dark:bg-slate-800 border border-base-200 dark:border-slate-700 rounded-2xl p-6 mb-6 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-on-surface-variant dark:text-slate-400">Order ID</span>
                  <span className="text-sm font-mono font-bold text-primary dark:text-emerald-400">{donation.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-on-surface-variant dark:text-slate-400">Nominal</span>
                  <span className="text-sm font-bold text-on-surface dark:text-white">{formatCurrency(donation.amount)}</span>
                </div>
                {campaign && (
                  <div className="flex justify-between">
                    <span className="text-sm text-on-surface-variant dark:text-slate-400">Program</span>
                    <span className="text-sm font-medium text-on-surface dark:text-white text-right max-w-[60%] truncate">{campaign.title}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-on-surface-variant dark:text-slate-400">Metode</span>
                  <span className="text-sm font-medium text-on-surface dark:text-white">{donation.paymentMethod || '-'}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {campaign && (
                <Link to={`/explore/${campaign.id}`} className="w-full bg-primary dark:bg-emerald-600 hover:bg-primary/90 dark:hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
                  Kembali ke Program
                </Link>
              )}
              <Link to="/profile" className="w-full bg-base-200 dark:bg-slate-700 hover:bg-base-300 dark:hover:bg-slate-600 text-on-surface dark:text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                Lihat Riwayat Donasi
              </Link>
            </div>
          </div>
        )}

        {/* ── Pending ── */}
        {status === 'pending' && (
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-warning/10 dark:bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[56px] text-warning dark:text-amber-400 animate-pulse">schedule</span>
            </div>
            <h1 className="text-3xl font-bold text-on-surface dark:text-white mb-2 font-headline">Menunggu Pembayaran</h1>
            <p className="text-on-surface-variant dark:text-slate-400 mb-2">Transaksi Anda masih dalam status menunggu konfirmasi.</p>
            <p className="text-xs text-on-surface-variant/60 dark:text-slate-500 mb-6">Halaman ini akan otomatis memperbarui status. ({pollCount}/60)</p>

            {donation && (
              <div className="bg-base-100 dark:bg-slate-800 border border-base-200 dark:border-slate-700 rounded-2xl p-6 mb-6 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-on-surface-variant dark:text-slate-400">Order ID</span>
                  <span className="text-sm font-mono font-bold text-primary dark:text-emerald-400">{donation.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-on-surface-variant dark:text-slate-400">Nominal</span>
                  <span className="text-sm font-bold text-on-surface dark:text-white">{formatCurrency(donation.amount)}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {campaign && (
                <Link to={`/explore/${campaign.id}`} className="w-full bg-primary dark:bg-emerald-600 hover:bg-primary/90 dark:hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Kembali ke Program
                </Link>
              )}
              <Link to="/explore" className="w-full bg-base-200 dark:bg-slate-700 hover:bg-base-300 dark:hover:bg-slate-600 text-on-surface dark:text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">explore</span>
                Jelajahi Program Lain
              </Link>
            </div>
          </div>
        )}

        {/* ── Failed / Expired ── */}
        {(status === 'failed' || status === 'expired') && (
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-error/10 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[56px] text-error dark:text-red-400">cancel</span>
            </div>
            <h1 className="text-3xl font-bold text-on-surface dark:text-white mb-2 font-headline">
              {status === 'expired' ? 'Pembayaran Kedaluwarsa' : 'Pembayaran Gagal'}
            </h1>
            <p className="text-on-surface-variant dark:text-slate-400 mb-6">
              {status === 'expired' 
                ? 'Waktu pembayaran telah habis. Silakan coba lagi.'
                : 'Transaksi tidak dapat diproses. Silakan coba kembali.'
              }
            </p>

            <div className="flex flex-col gap-3">
              {campaign && (
                <Link to={`/explore/${campaign.id}`} className="w-full bg-primary dark:bg-emerald-600 hover:bg-primary/90 dark:hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Coba Donasi Lagi
                </Link>
              )}
              <Link to="/explore" className="w-full bg-base-200 dark:bg-slate-700 hover:bg-base-300 dark:hover:bg-slate-600 text-on-surface dark:text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">explore</span>
                Jelajahi Program Lain
              </Link>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <div className="text-center">
            <span className="material-symbols-outlined text-[80px] text-error/40 mb-4 block">error</span>
            <h1 className="text-2xl font-bold text-on-surface dark:text-white mb-2">Terjadi Kesalahan</h1>
            <p className="text-on-surface-variant dark:text-slate-400 mb-8">Tidak dapat memverifikasi transaksi. Silakan periksa riwayat donasi Anda.</p>
            <div className="flex flex-col gap-3">
              <Link to="/profile" className="w-full bg-primary dark:bg-emerald-600 hover:bg-primary/90 dark:hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                Lihat Riwayat Donasi
              </Link>
              <Link to="/explore" className="w-full bg-base-200 dark:bg-slate-700 hover:bg-base-300 dark:hover:bg-slate-600 text-on-surface dark:text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">explore</span>
                Jelajahi Program
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
