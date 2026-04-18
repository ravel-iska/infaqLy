import { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateTime } from '@/utils/formatDate';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function WithdrawalsPage() {
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  const [balancePending, setBalancePending] = useState(true);
  const [balance, setBalance] = useState({ settled: 0, withdrawn: 0, available: 0 });
  const [campaignBalances, setCampaignBalances] = useState([]);

  const fetchData = async () => {
    try {
      const [histRes, balRes, campBalRes] = await Promise.all([
        api.get('/withdrawals'),
        api.get('/withdrawals/balance'),
        api.get('/withdrawals/campaign-balances'),
      ]);
      setHistory(histRes.withdrawals || []);
      setBalance(balRes);
      setCampaignBalances(campBalRes.balances || []);
    } catch (err) {
      toast.error('Gagal memuat data penarikan');
    } finally {
      setBalancePending(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const eligibleCampaigns = campaignBalances.filter(c => c.eligible);

  const handleNewWithdrawal = async (data) => {
    try {
      const formData = new FormData();
      formData.append('amount', data.amount);
      formData.append('bankInfo', data.bankInfo);
      formData.append('note', data.note);
      formData.append('campaignId', data.campaignId);
      if (data.evidenceFile) {
        formData.append('evidence', data.evidenceFile);
      }

      await api.upload('/withdrawals', formData);
      toast.success(`Penarikan ${formatCurrency(data.amount)} berhasil dicatat!`);
      setShowModal(false);
      fetchData(); // Refresh list and balance
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan sistem');
    }
  };

  if (balancePending) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-12 h-12 text-admin-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-base-content">payments</span>
          <h1 className="text-2xl font-bold text-base-content tracking-tight">Penarikan Dana</h1>
        </div>
        <button
          onClick={() => eligibleCampaigns.length > 0 ? setShowModal(true) : toast.error('Belum ada kampanye yang mencapai target dan memiliki saldo siap tarik.')}
          className="btn btn-primary px-6 flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span> Tarik Dana Baru
        </button>
      </div>

      {/* Global Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-base-100 shadow rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/10 rounded-bl-[100px] -z-10 group-hover:bg-primary/20 transition-colors"></div>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-base-content/60 text-[20px]">account_balance_wallet</span>
            <p className="text-sm font-semibold text-base-content/60">Saldo Total Terkumpul</p>
          </div>
          <p className="text-3xl font-bold text-base-content font-headline mt-1 tracking-tight">{formatCurrency(balance.settled)}</p>
        </div>
        <div className="bg-base-100 shadow rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
           <div className="absolute right-0 top-0 w-24 h-24 bg-error/10 rounded-bl-[100px] -z-10 group-hover:bg-error/20 transition-colors"></div>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-error text-[20px]">publish</span>
            <p className="text-sm font-semibold text-base-content/60">Total Dana Keluar</p>
          </div>
          <p className="text-3xl font-bold text-error font-headline mt-1 tracking-tight">{formatCurrency(balance.withdrawn)}</p>
        </div>
        <div className="bg-base-100 shadow rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
           <div className="absolute right-0 top-0 w-24 h-24 bg-success/10 rounded-bl-[100px] -z-10 group-hover:bg-success/20 transition-colors"></div>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-success text-[20px]">credit_score</span>
            <p className="text-sm font-semibold text-base-content/60">Saldo Siap Dicairkan</p>
          </div>
          <p className="text-3xl font-bold text-success font-headline mt-1 tracking-tight">{formatCurrency(balance.available)}</p>
        </div>
      </div>

      {/* Per-Campaign Balance Cards */}
      <div className="bg-base-100 shadow rounded-2xl overflow-hidden mt-6">
        <div className="px-6 py-5 border-b border-base-200 flex items-center gap-2 bg-base-200/50">
          <span className="material-symbols-outlined text-primary text-[20px]">campaign</span>
          <h2 className="text-lg font-bold text-base-content">Saldo Per Kampanye</h2>
        </div>
        {campaignBalances.length === 0 ? (
          <div className="text-center py-10 text-base-content/50">
            <span className="material-symbols-outlined text-4xl opacity-30 mb-2 block">campaign</span>
            <p className="text-sm">Belum ada kampanye</p>
          </div>
        ) : (
          <div className="divide-y divide-base-200">
            {campaignBalances.map((c) => {
              const progress = c.target > 0 ? Math.min(Math.round((c.totalDonated / c.target) * 100), 100) : 0;
              return (
                <div key={c.campaignId} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-base-200/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-bold text-base-content truncate">{c.campaignTitle}</p>
                      {c.reachedTarget ? (
                        <div className="badge badge-success badge-sm gap-1 font-bold px-2 py-3">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span> Target Tercapai
                        </div>
                      ) : (
                        <div className="badge badge-warning badge-sm gap-1 font-bold px-2 py-3">
                          <span className="material-symbols-outlined text-[14px]">schedule</span> {progress}%
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 w-full max-w-sm mb-2">
                       <progress className={`progress flex-1 ${c.reachedTarget ? 'progress-success' : 'progress-secondary'}`} value={progress} max="100"></progress>
                    </div>
                    <div className="flex gap-4 text-xs text-base-content/60 font-mono">
                      <span>Target: {formatCurrency(c.target)}</span>
                      <span>Terkumpul: {formatCurrency(c.totalDonated)}</span>
                      <span>Ditarik: {formatCurrency(c.totalWithdrawn)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-bold font-mono tracking-tight ${c.available > 0 ? 'text-success' : 'text-base-content/50'}`}>
                      {formatCurrency(c.available)}
                    </p>
                    <p className="text-[11px] text-base-content/60 font-medium mt-0.5 uppercase tracking-wider">Siap Cairkan</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-base-100 shadow rounded-2xl overflow-hidden mt-6">
        <div className="px-6 py-5 border-b border-base-200 flex items-center gap-2 bg-base-200/50">
          <span className="material-symbols-outlined text-primary text-[20px]">history_edu</span>
          <h2 className="text-lg font-bold text-base-content">Riwayat Penarikan Dana</h2>
        </div>
        
        {history.length === 0 ? (
          <div className="text-center py-16 text-base-content/50 flex flex-col items-center bg-base-200/30">
            <span className="material-symbols-outlined text-6xl opacity-30 mb-4">money_off</span>
            <p className="text-lg font-bold text-base-content">Belum ada penarikan</p>
            <p className="text-sm mt-1">Data penarikan dana ke rekening yayasan akan muncul di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-md w-full">
              <thead>
                <tr>
                  <th className="bg-base-200">Tanggal & Jam</th>
                  <th className="bg-base-200">Kampanye</th>
                  <th className="bg-base-200">Nominal</th>
                  <th className="bg-base-200">Rekening Tujuan</th>
                  <th className="bg-base-200">Detail Penyaluran</th>
                  <th className="bg-base-200 text-center">Dokumen/Bukti</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="text-base-content/60 font-mono font-medium text-xs">{formatDateTime(h.createdAt)}</td>
                    <td>
                      <span className="text-base-content font-bold text-xs">{h.campaignTitle || 'Global (Legacy)'}</span>
                    </td>
                    <td className="text-base-content font-mono font-bold tracking-tight">{formatCurrency(h.amount)}</td>
                    <td>
                      <div className="flex items-center gap-2 text-base-content font-medium">
                        <span className="material-symbols-outlined text-base-content/50 text-[16px]">account_balance</span>
                        {h.bankInfo}
                      </div>
                    </td>
                    <td className="text-base-content/70 font-medium">{h.note}</td>
                    <td className="text-center">
                      {h.evidenceUrl ? (
                        <button
                          onClick={() => setPreviewImage(h.evidenceUrl)}
                          className="btn btn-sm btn-outline text-primary"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span> Lihat
                        </button>
                      ) : (
                        <span className="badge">Tidak dilampirkan</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showModal && (
        <WithdrawalModal
          eligibleCampaigns={eligibleCampaigns}
          onClose={() => setShowModal(false)}
          onSubmit={handleNewWithdrawal}
        />
      )}

      {/* Evidence Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-2xl mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -top-4 -right-4 p-2 bg-base-100 rounded-full text-base-content hover:text-error hover:bg-error/10 transition-colors z-10 shadow-lg">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="p-2 bg-base-100 border border-base-200 rounded-xl shadow-2xl">
              <img src={previewImage} alt="Bukti penyaluran" className="rounded-lg max-h-[80vh] w-auto mx-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WithdrawalModal({ eligibleCampaigns, onClose, onSubmit }) {
  const [selectedCampaign, setSelectedCampaign] = useState(eligibleCampaigns[0] || null);
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [note, setNote] = useState('');
  const [evidencePreview, setEvidencePreview] = useState(null);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const maxAmount = selectedCampaign?.available || 0;

  const handleCampaignChange = (e) => {
    const camp = eligibleCampaigns.find(c => c.campaignId === Number(e.target.value));
    setSelectedCampaign(camp || null);
    setAmount(''); // reset amount when switching campaign
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('File harus berupa gambar (JPG, PNG) atau PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }

    setEvidenceFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setEvidencePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      // PDF — show icon placeholder
      setEvidencePreview('pdf:' + file.name);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange({ target: { files: [file] } });
    }
  };

  const removeEvidence = () => {
    setEvidencePreview(null);
    setEvidenceFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedCampaign) {
      toast.error('Pilih kampanye terlebih dahulu');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Nominal penarikan harus diisi');
      return;
    }
    if (Number(amount) > maxAmount) {
      toast.error(`Saldo tidak cukup. Tersedia: ${formatCurrency(maxAmount)}`);
      return;
    }
    if (!bank.trim()) {
      toast.error('Info rekening bank wajib diisi');
      return;
    }
    if (!note.trim()) {
      toast.error('Keterangan wajib diisi');
      return;
    }
    if (!evidenceFile) {
      toast.error('Bukti penyaluran wajib diunggah');
      return;
    }

    setLoading(true);
    await onSubmit({
      amount: Number(amount),
      bankInfo: bank.trim(),
      note: note.trim(),
      evidenceFile: evidenceFile,
      campaignId: selectedCampaign.campaignId,
    });
    setLoading(false);
  };

  const isPdf = evidencePreview?.startsWith('pdf:');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in px-4" onClick={onClose}>
      <div className="bg-base-100 border border-base-200 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-base-200">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                 <span className="material-symbols-outlined text-[24px]">account_balance</span>
             </div>
            <h2 className="text-xl font-bold text-base-content tracking-tight">Formulir Penarikan Cair</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm text-base-content/50 hover:text-base-content transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-5">
          {/* Campaign Selector */}
          <div>
            <label className="block text-sm font-semibold text-base-content/70 mb-2">Pilih Kampanye <span className="text-error">*</span></label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 text-[20px]">campaign</span>
              <select
                value={selectedCampaign?.campaignId || ''}
                onChange={handleCampaignChange}
                className="select select-bordered w-full pl-12 font-medium"
              >
                {eligibleCampaigns.map((c) => (
                  <option key={c.campaignId} value={c.campaignId}>
                    {c.campaignTitle} — Saldo: {formatCurrency(c.available)}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-base-content/50 mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">info</span>
              Hanya kampanye yang sudah mencapai target yang bisa ditarik dananya
            </p>
          </div>

          <div className="bg-success/5 border border-success/20 p-4 rounded-xl flex items-center justify-between">
              <span className="text-sm font-semibold text-base-content/70">Plafon Maksimal</span>
              <span className="text-lg font-bold text-success font-mono">{formatCurrency(maxAmount)}</span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-base-content/70 mb-2">Nominal Diminta (Rp) <span className="text-error">*</span></label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-base-content/50">Rp</span>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Nominal angka murni"
                    className="input input-bordered w-full pl-10 font-mono tracking-wider font-bold text-lg"
                    min="0"
                    max={maxAmount}
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-base-content/70 mb-2">Data Rekening Korporat/Penerima <span className="text-error">*</span></label>
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 text-[20px]">domain</span>
                <input
                    type="text"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    placeholder="Misal: MANDIRI - 1234xxx - Yayasan ABC"
                    className="input input-bordered w-full pl-12 font-medium"
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-base-content/70 mb-2">Peruntukan/Keterangan Penyaluran <span className="text-error">*</span></label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Jelaskan secara ringkas tujuan penggunaan dana..."
              rows={3}
              className="textarea textarea-bordered w-full resize-none font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-base-content/70 mb-2 flex items-center justify-between">
                <span>Dokumen Bukti/Kuitansi Fisik <span className="text-error">*</span></span>
                <span className="text-[10px] text-base-content/50 font-normal bg-base-200 px-2 py-0.5 rounded">Maks 10MB</span>
            </label>
            
            {evidencePreview ? (
              <div className="relative group rounded-xl overflow-hidden border border-base-200 bg-base-200/50">
                {isPdf ? (
                  <div className="flex items-center gap-3 p-5">
                    <div className="w-12 h-12 rounded bg-error/10 text-error flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm text-base-content font-bold truncate">{evidencePreview.replace('pdf:', '')}</p>
                      <p className="text-xs text-base-content/50 mt-0.5">Lampiran Dokumen Layak Saji</p>
                    </div>
                  </div>
                ) : (
                  <img src={evidencePreview} alt="Bukti" className="w-full h-48 object-cover" />
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-base-100/90 backdrop-blur rounded-lg border border-base-200 text-base-content hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">find_replace</span>
                  </button>
                  <button
                    onClick={removeEvidence}
                    className="p-2 bg-base-100/90 backdrop-blur rounded-lg border border-base-200 text-base-content hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-base-300 hover:border-primary hover:bg-primary/5 rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer bg-base-100"
              >
                <div className="w-14 h-14 rounded-full bg-base-200 border border-base-300 text-base-content/40 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[28px]">upload_file</span>
                </div>
                <p className="text-sm font-bold text-base-content">Klik area ini untuk memuat berkas pendukung</p>
                <p className="text-xs text-base-content/50 font-medium mt-1">Mendukung format gambar rilis dan PDF.</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-base-200">
          <button onClick={onClose} disabled={loading} className="btn btn-ghost border border-base-300">Batal</button>
          <button onClick={handleSubmit} disabled={loading} className="btn btn-primary font-bold text-sm px-8 flex items-center gap-2">
            {loading ? <span className="loading loading-spinner"></span> : <span className="material-symbols-outlined text-[18px]">check_circle</span>}
            {loading ? 'Menyimpan...' : 'Otorisasi Pencairan'}
          </button>
        </div>
      </div>
    </div>
  );
}
