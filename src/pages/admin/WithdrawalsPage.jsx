import { useState, useRef, useEffect } from 'react';
import { Plus, Upload, Paperclip, X, Image, Eye, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateTime, nowTimestamp } from '@/utils/formatDate';
import { getAllCampaigns } from '@/services/campaignService';
import toast from 'react-hot-toast';

const INITIAL_HISTORY = [
  { id: 1, datetime: '2026-04-10T14:30:00', amount: 50000000, bank: 'BCA - 1234567890 - Yayasan Al-Ikhlas', note: 'Penyaluran renovasi masjid', evidence: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop' },
  { id: 2, datetime: '2026-04-01T09:15:00', amount: 80000000, bank: 'BCA - 1234567890 - Yayasan Al-Ikhlas', note: 'Penyaluran santunan yatim', evidence: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop' },
  { id: 3, datetime: '2026-03-15T11:45:00', amount: 50000000, bank: 'BSI - 9876543210 - Yayasan Nurul Iman', note: 'Penyaluran wakaf quran', evidence: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop' },
];

export default function WithdrawalsPage() {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('infaqly_withdrawals');
      return saved ? JSON.parse(saved) : INITIAL_HISTORY;
    } catch {
      return INITIAL_HISTORY;
    }
  });
  const [showModal, setShowModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [settled, setSettled] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const campaigns = await getAllCampaigns();
        setSettled(campaigns.reduce((s, c) => s + c.collected, 0));
      } catch {}
    })();
  }, []);

  const totalWithdrawn = history.reduce((s, h) => s + h.amount, 0);
  const available = Math.max(0, settled - totalWithdrawn);

  // Simpan ke localStorage setiap kali history berubah
  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem('infaqly_withdrawals', JSON.stringify(newHistory));
  };

  const handleNewWithdrawal = (data) => {
    const newEntry = {
      id: Date.now(),
      datetime: nowTimestamp(),
      ...data,
    };
    saveHistory([newEntry, ...history]);
    setShowModal(false);
    toast.success(`Penarikan ${formatCurrency(data.amount)} berhasil dicatat! ✅`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-admin-text">💸 Penarikan Dana</h1>
        <button onClick={() => setShowModal(true)} className="btn-admin-primary text-sm"><Plus size={16} /> Tarik Dana Baru</button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <p className="text-sm text-admin-text-secondary">💰 Saldo Settled</p>
          <p className="text-2xl font-bold text-admin-text font-mono mt-1">{formatCurrency(settled)}</p>
        </div>
        <div className="admin-card p-5">
          <p className="text-sm text-admin-text-secondary">📤 Total Ditarik</p>
          <p className="text-2xl font-bold text-admin-accent font-mono mt-1">{formatCurrency(totalWithdrawn)}</p>
        </div>
        <div className="admin-card p-5 border-l-2 border-l-admin-accent-secondary">
          <p className="text-sm text-admin-text-secondary">💵 Saldo Tersedia</p>
          <p className="text-2xl font-bold text-admin-accent-secondary font-mono mt-1">{formatCurrency(available)}</p>
        </div>
      </div>

      {/* History */}
      <div className="admin-card overflow-hidden">
        <div className="px-5 py-4 border-b border-admin-border">
          <h2 className="text-lg font-semibold text-admin-text">Riwayat Penarikan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-admin-bg-sidebar">
                <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Tanggal & Jam</th>
                <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Nominal</th>
                <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Rekening Tujuan</th>
                <th className="text-left px-5 py-3 text-admin-text-secondary font-medium">Keterangan</th>
                <th className="text-center px-5 py-3 text-admin-text-secondary font-medium">Bukti</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-admin-border last:border-0 hover:bg-admin-bg-hover transition-colors">
                  <td className="px-5 py-4 text-admin-text font-mono text-xs">{formatDateTime(h.datetime)}</td>
                  <td className="px-5 py-4 text-admin-text font-mono font-semibold">{formatCurrency(h.amount)}</td>
                  <td className="px-5 py-4 text-admin-text-secondary">{h.bank}</td>
                  <td className="px-5 py-4 text-admin-text-secondary">{h.note}</td>
                  <td className="px-5 py-4 text-center">
                    {h.evidence ? (
                      <button
                        onClick={() => setPreviewImage(h.evidence)}
                        className="inline-flex items-center gap-1 text-admin-accent hover:text-admin-accent-hover transition-colors text-xs font-medium"
                      >
                        <Eye size={14} /> Lihat
                      </button>
                    ) : (
                      <span className="text-admin-text-muted text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showModal && (
        <WithdrawalModal
          available={available}
          onClose={() => setShowModal(false)}
          onSubmit={handleNewWithdrawal}
        />
      )}

      {/* Evidence Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-2xl mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -top-3 -right-3 p-1.5 bg-admin-bg-card rounded-full border border-admin-border text-admin-text hover:text-danger transition-colors z-10">
              <X size={18} />
            </button>
            <img src={previewImage} alt="Bukti penyaluran" className="rounded-admin max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

function WithdrawalModal({ available, onClose, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [note, setNote] = useState('');
  const [evidencePreview, setEvidencePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Nominal penarikan harus diisi');
      return;
    }
    if (Number(amount) > available) {
      toast.error(`Saldo tidak cukup. Tersedia: ${formatCurrency(available)}`);
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
    if (!evidencePreview) {
      toast.error('Bukti penyaluran wajib diupload');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    onSubmit({
      amount: Number(amount),
      bank: bank.trim(),
      note: note.trim(),
      evidence: evidencePreview.startsWith('pdf:') ? null : evidencePreview,
    });
    setLoading(false);
  };

  const isPdf = evidencePreview?.startsWith('pdf:');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-admin-bg-card border border-admin-border rounded-admin p-6 w-full max-w-lg mx-4 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-admin-text">💸 Form Penarikan Dana</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-admin-bg-hover text-admin-text-muted hover:text-admin-text transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Nominal Penarikan (Rp) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000000"
              className="input-admin"
              min="0"
            />
            <p className="text-xs text-admin-text-muted mt-1">Saldo tersedia: {formatCurrency(available)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Nama Bank & Rekening Tujuan *</label>
            <input
              type="text"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder="BCA - 1234567890 - Yayasan Al-Ikhlas"
              className="input-admin !font-sans"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Keterangan *</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Penyaluran dana renovasi masjid fase 2..."
              rows={3}
              className="input-admin resize-none !font-sans"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Upload Bukti Penyaluran *</label>
            
            {evidencePreview ? (
              <div className="relative group rounded-admin overflow-hidden border border-admin-border">
                {isPdf ? (
                  <div className="flex items-center gap-3 p-4 bg-admin-bg-sidebar">
                    <Paperclip size={24} className="text-admin-accent" />
                    <div className="flex-1">
                      <p className="text-sm text-admin-text font-medium">{evidencePreview.replace('pdf:', '')}</p>
                      <p className="text-xs text-admin-text-muted">Dokumen PDF</p>
                    </div>
                  </div>
                ) : (
                  <img src={evidencePreview} alt="Bukti" className="w-full h-48 object-cover" />
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
                    title="Ganti file"
                  >
                    <Image size={16} />
                  </button>
                  <button
                    onClick={removeEvidence}
                    className="p-1.5 bg-red-500/80 rounded-lg text-white hover:bg-red-600 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-admin-border rounded-admin p-8 text-center hover:border-admin-accent transition-colors cursor-pointer"
              >
                <Upload size={32} className="mx-auto text-admin-text-muted mb-2" />
                <p className="text-sm text-admin-text-secondary">Klik atau drag & drop foto/nota di sini</p>
                <p className="text-xs text-admin-text-muted mt-1">JPG, PNG, atau PDF — maks 10MB</p>
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

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-admin-border">
          <button onClick={onClose} className="btn-admin-ghost text-sm">Batal</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-admin-primary text-sm">
            {loading ? <span className="animate-pulse">Memproses...</span> : '✅ Simpan Penarikan'}
          </button>
        </div>
      </div>
    </div>
  );
}
