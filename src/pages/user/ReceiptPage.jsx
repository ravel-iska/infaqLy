import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import { generateCertificate } from '@/utils/generateCertificate';

export default function ReceiptPage() {
  const { orderId } = useParams();
  const [donation, setDonation] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/donations/${orderId}`);
        if (!res.ok) throw new Error('Transaksi tidak ditemukan');
        const data = await res.json();
        setDonation(data.donation);

        // Load campaign info
        if (data.donation?.campaignId) {
          const cRes = await fetch(`/api/campaigns/${data.donation.campaignId}`);
          if (cRes.ok) {
            const cData = await cRes.json();
            setCampaign(cData.campaign || cData);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (orderId) load();
  }, [orderId]);

  const handlePrintCertificate = () => {
    if (!donation) return;
    generateCertificate({
      donorName: donation.donorName,
      program: campaign?.title || 'Program Donasi InfaqLy',
      amount: donation.amount,
      date: donation.paidAt || donation.createdAt,
      transactionId: donation.orderId,
    });
  };

  const handleDownloadPdf = () => {
    window.open(`/api/donations/${orderId}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
        <p className="text-base-content/50 font-medium">Memuat kuitansi...</p>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <span className="material-symbols-outlined text-6xl text-error/30 mb-4">error</span>
        <h2 className="text-xl font-bold text-base-content mb-2">Kuitansi Tidak Ditemukan</h2>
        <p className="text-base-content/60 mb-6">Order ID <code className="font-mono text-primary">{orderId}</code> tidak valid atau telah kedaluwarsa.</p>
        <Link to="/" className="btn btn-primary">Kembali ke Beranda</Link>
      </div>
    );
  }

  if (donation.paymentStatus !== 'success') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <span className="material-symbols-outlined text-6xl text-warning/40 mb-4">schedule</span>
        <h2 className="text-xl font-bold text-base-content mb-2">Pembayaran Belum Selesai</h2>
        <p className="text-base-content/60 mb-6">Kuitansi hanya tersedia untuk donasi yang sudah berhasil dibayar.</p>
        <Link to="/" className="btn btn-primary">Kembali ke Beranda</Link>
      </div>
    );
  }

  const programTitle = campaign?.title || 'Program Donasi InfaqLy';

  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-t-[2rem] p-6 sm:p-8 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-headline mb-1">
            🕌 infaq<span className="text-emerald-200">Ly</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-[3px] uppercase text-white/80">Kuitansi Donasi Digital</p>
        </div>
      </div>

      {/* Body Card */}
      <div className="bg-base-100 shadow-2xl shadow-base-300/30 dark:shadow-black/30 rounded-b-[2rem] border border-base-200 dark:border-base-content/10 overflow-hidden">
        {/* Success Badge */}
        <div className="flex justify-center -mt-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-success/10 border border-success/30 text-success px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-success/10">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Pembayaran Berhasil
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Donor Name */}
          <div className="text-center">
            <p className="text-[10px] font-semibold text-base-content/40 tracking-[2px] uppercase mb-1">Donatur</p>
            <h2 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight font-headline">{donation.donorName}</h2>
          </div>

          {/* Amount Box */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-5 text-center">
            <p className="text-[10px] font-semibold text-base-content/40 tracking-[2px] uppercase mb-1">Total Donasi</p>
            <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-headline">
              {formatCurrency(donation.amount)}
            </p>
          </div>

          {/* Details */}
          <div className="border-t border-dashed border-base-200 dark:border-base-content/10 pt-5 space-y-3">
            <div className="flex justify-between items-start gap-3">
              <span className="text-xs font-medium text-base-content/50">Program</span>
              <span className="text-xs font-bold text-base-content text-right">{programTitle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-base-content/50">Tanggal</span>
              <span className="text-xs font-bold text-base-content">{formatDate(donation.paidAt || donation.createdAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-base-content/50">Metode</span>
              <span className="text-xs font-bold text-base-content">{donation.paymentMethod || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-base-content/50">No. Referensi</span>
              <span className="text-[10px] font-mono font-bold text-primary/60 tracking-tight">{donation.orderId}</span>
            </div>
          </div>

          {/* Thank You */}
          <div className="text-center pt-2 border-t border-dashed border-base-200 dark:border-base-content/10">
            <p className="text-sm text-base-content/60 font-medium leading-relaxed">
              Jazakallahu khairan atas kebaikan Anda.<br />
              Semoga Allah memberikan balasan berlipat ganda.
            </p>
            <p className="text-2xl mt-2">🤲</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handlePrintCertificate}
              className="btn btn-primary flex-1 gap-2 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              Cetak Kuitansi
            </button>
            <button
              onClick={handleDownloadPdf}
              className="btn btn-outline flex-1 gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Unduh PDF
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-base-200/50 dark:bg-base-content/5 px-6 py-4 text-center border-t border-base-200 dark:border-base-content/5">
          <p className="text-[10px] text-base-content/40 font-medium">
            Dokumen ini sah secara digital dan diterbitkan oleh <strong className="text-base-content/60">infaqLy</strong> — Platform Donasi Digital
          </p>
        </div>
      </div>
    </div>
  );
}
