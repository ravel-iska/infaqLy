import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/services/api';

function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up relative">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <h3 className="font-headline text-xl font-bold text-on-surface dark:text-slate-100">Syarat & Ketentuan</h3>
          <button onClick={onClose} aria-label="Tutup" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto font-body text-slate-600 dark:text-slate-300 text-sm space-y-4 shadow-inner dark:bg-slate-900">
          <p>Selamat datang di InfaqLy. Dengan menggunakan layanan platform ini, Anda menyetujui seluruh syarat dan ketentuan berikut:</p>
          
          <h4 className="font-bold text-slate-800 dark:text-emerald-400 text-base mt-6">1. Penggunaan Layanan</h4>
          <p>Platform InfaqLy ditujukan semata-mata untuk memfasilitasi transaksi donasi (Infaq, Sedekah, Wakaf) antara donatur dan program yang sah. Penggunaan platform untuk tujuan penipuan atau pencucian uang dilarang keras.</p>
          
          <h4 className="font-bold text-slate-800 text-base mt-6">2. Transparansi Dana</h4>
          <p>Semua dana yang disalurkan melalui platform ini dicatat secara transparan dan dilaporkan secara berkala kepada donatur. InfaqLy berhak memotong sebagian kecil dana (jika disetujui sebelumnya) untuk biaya operasional server dan payment gateway sesuai ketentuan yang wajar.</p>
          
          <h4 className="font-bold text-slate-800 text-base mt-6">3. Privasi Data</h4>
          <p>Data pribadi Anda (Nama, Email, dan Nomor WhatsApp) akan dijaga kerahasiaannya dan hanya digunakan untuk keperluan administratif donasi (seperti notifikasi kuitansi dan progres program). Kami tidak akan menjual atau membagikan data kepada pihak ketiga.</p>
          
          <h4 className="font-bold text-slate-800 text-base mt-6">4. Pengembalian Dana (Refund)</h4>
          <p>Dana donasi yang telah terkonfirmasi sukses secara prinsip tidak dapat dikembalikan (non-refundable), kecuali terbukti terjadi kesalahan teknis dari pihak sistem kami (contoh: pembayaran ganda/double charge).</p>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6 bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-xl text-amber-900/80 dark:text-amber-500 italic text-xs">
            InfaqLy berhak setiap saat mengubah atau memperbarui halaman Syarat & Ketentuan ini tanpa pemberitahuan sebelumnya. Pastikan Anda membacanya secara berkala.
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0">
          <button onClick={onClose} className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm">Saya Mengerti</button>
        </div>
      </div>
    </div>
  );
}

function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up relative">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <h3 className="font-headline text-xl font-bold text-on-surface dark:text-slate-100">Kebijakan Privasi</h3>
          <button onClick={onClose} aria-label="Tutup" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto font-body text-slate-600 dark:text-slate-300 text-sm space-y-4 shadow-inner dark:bg-slate-900">
          <p>Di InfaqLy, privasi Anda adalah prioritas utama kami. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.</p>
          
          <h4 className="font-bold text-slate-800 dark:text-emerald-400 text-base mt-6">1. Pengumpulan Data</h4>
          <p>Kami hanya mengumpulkan data yang diperlukan untuk transaksi donasi dan notifikasi, meliputi: Nama Lengkap, Alamat Email, Nomor WhatsApp/Telepon, dan histori donasi.</p>
          
          <h4 className="font-bold text-slate-800 text-base mt-6">2. Penggunaan Data</h4>
          <p>Data Anda hanya digunakan secara internal untuk memverifikasi transaksi, memberikan laporan perkembangan program, mengirimkan bukti donasi (kuitansi), dan menghubungi Anda terkait keamanan akun (OTP).</p>
          
          <h4 className="font-bold text-slate-800 text-base mt-6">3. Keamanan & Kerahasiaan Data</h4>
          <p>Seluruh transaksi Anda dienkripsi (SSL) dan disalurkan melalui mitra Payment Gateway resmi yang mengantongi izin dari Bank Indonesia (Midtrans). Kami berkomitmen untuk <strong>tidak pernah menjual, menukar, atau menyebarluaskan data Anda</strong> ke pihak luar untuk tujuan komersil apapun tanpa izin eksplisit Anda.</p>
          
          <h4 className="font-bold text-slate-800 dark:text-emerald-400 text-base mt-6">4. Pilihan Anonimitas</h4>
          <p>Jika Anda memilih untuk berdonasi secara anonim, sistem InfaqLy akan mentopeng nama Anda (menjadi Hamba Allah) di seluruh daftar donatur publik, sehingga privasi Anda lebih terjaga secara sosial.</p>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0">
          <button onClick={onClose} className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm">Saya Mengerti</button>
        </div>
      </div>
    </div>
  );
}

function BugModal({ isOpen, onClose }) {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/bugs', { userName, userEmail, message, path: window.location.pathname });
      toast.success('Laporan berhasil dikirim, terima kasih!');
      onClose();
      setMessage('');
    } catch (err) {
      toast.error('Gagal mengirim laporan.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up relative">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <h3 className="font-headline text-xl font-bold text-on-surface dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500">bug_report</span> Lapor Bug / Kesalahan
          </h3>
          <button onClick={onClose} aria-label="Tutup" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto font-body text-slate-600 dark:text-slate-300 text-sm space-y-4 shadow-inner dark:bg-slate-900">
          <p>Jika antarmuka bermasalah atau Anda menemukan celah keamanan, laporkan agar segera kami perbaiki!</p>
          <div>
            <label className="block text-xs font-bold mb-1 opacity-70">Nama</label>
            <input required type="text" value={userName} onChange={e=>setUserName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" placeholder="Nama Anda" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 opacity-70">Email</label>
            <input required type="email" value={userEmail} onChange={e=>setUserEmail(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" placeholder="Email Anda" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 opacity-70">Pesan Laporan</label>
            <textarea required rows={4} value={message} onChange={e=>setMessage(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none text-sm" placeholder="Ceritakan bagian mana yang macet..."></textarea>
          </div>
          <button disabled={loading} type="submit" className="w-full py-3 mt-4 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors shadow-sm flex justify-center items-center gap-2">
            {loading ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
            Kirim Laporan
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Footer() {
  const [hasWa, setHasWa] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isBugOpen, setIsBugOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get('/settings/public');
        if (data.hasWa) setHasWa(data.hasWa);
      } catch (err) {}
    };
    fetchSettings();
  }, []);
  return (
    <footer className="bg-slate-900 border-t border-slate-800 w-full rounded-t-[3rem] mt-auto transition-colors duration-300 shadow-2xl relative z-10 overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-10 lg:gap-14 px-8 lg:px-12 py-20 max-w-7xl mx-auto font-body text-sm leading-relaxed relative z-10">
        <div className="md:col-span-2 space-y-8">
          <div className="text-2xl font-headline font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-emerald-400">volunteer_activism</span>
            Infaqly
          </div>
          <p className="text-slate-400 max-w-sm text-base leading-relaxed">Membangun ekosistem filantropi digital yang amanah, transparan, dan berdampak luas bagi umat.</p>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin);
                toast.success('Tautan disalin ke clipboard!');
              }}
              title="Bagikan Website"
              aria-label="Bagikan Website"
              className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-emerald-400 cursor-pointer hover:bg-emerald-500 hover:text-white hover:border-transparent transition-all shadow-lg hover:-translate-y-1"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
            <a 
              href="/"
              title="Kunjungi Website"
              aria-label="Kunjungi Website"
              className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-emerald-400 cursor-pointer hover:bg-emerald-500 hover:text-white hover:border-transparent transition-all shadow-lg hover:-translate-y-1"
            >
              <span className="material-symbols-outlined text-[20px]">language</span>
            </a>
          </div>
        </div>
        
        <div className="space-y-6">
          <h5 className="font-bold text-white text-lg tracking-wide">Program</h5>
          <ul className="space-y-4 text-slate-400 font-medium">
            <li><Link to="/explore" className="hover:text-emerald-400 transition-colors">Zakat Profesi</Link></li>
            <li><Link to="/explore" className="hover:text-emerald-400 transition-colors">Infaq Pendidikan</Link></li>
            <li><Link to="/explore" className="hover:text-emerald-400 transition-colors">Wakaf Produktif</Link></li>
            <li><Link to="/explore" className="hover:text-emerald-400 transition-colors">Sedekah Pangan</Link></li>
          </ul>
        </div>
        
        <div className="space-y-6">
          <h5 className="font-bold text-white text-lg tracking-wide">Bantuan</h5>
          <ul className="space-y-4 text-slate-400 font-medium">
            <li>
              <a 
                href={hasWa ? "/api/settings/whatsapp-redirect" : "#"} 
                target={hasWa ? "_blank" : undefined}
                rel="noopener noreferrer" 
                onClick={(e) => {
                  if (!hasWa) {
                    e.preventDefault();
                    toast('Nomor Bantuan/WhatsApp admin belum dikonfigurasi.', { icon: '⚠️' });
                  }
                }}
                className="hover:text-emerald-400 transition-colors"
              >
                Pusat Bantuan
              </a>
            </li>
            <li><Link to="/cara-donasi" className="hover:text-emerald-400 transition-colors">Cara Donasi</Link></li>
            <li>
              <button onClick={() => setIsBugOpen(true)} className="hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                <span className="material-symbols-outlined text-[18px] group-hover:text-emerald-400 transition-colors">bug_report</span> Lapor Bug Panel
              </button>
            </li>
          </ul>
        </div>
        
        <div className="space-y-6">
          <h5 className="font-bold text-white text-lg tracking-wide">Kontak</h5>
          <ul className="space-y-4 text-slate-400 font-medium">
            <li className="flex items-center gap-3 group">
              <span className="material-symbols-outlined text-[20px] text-slate-500 group-hover:text-emerald-400 transition-colors">mail</span>
              <a href="mailto:info@infaqly.org" className="hover:text-emerald-400 transition-colors">info@infaqly.org</a>
            </li>
            {hasWa && (
              <li className="flex items-center gap-3 group">
                <span className="material-symbols-outlined text-[20px] text-slate-500 group-hover:text-emerald-400 transition-colors">support_agent</span>
                <a href="/api/settings/whatsapp-redirect" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Tanya via WhatsApp</a>
              </li>
            )}
            <li className="flex items-start gap-3 group">
              <span className="material-symbols-outlined text-[20px] text-slate-500 group-hover:text-emerald-400 transition-colors mt-[2px]">location_on</span>
              <a href="https://www.google.com/maps/search/?api=1&query=South+Quarter+Tower+A+Jakarta" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors leading-relaxed">
                Jakarta South Quarter, Tower A, Lantai 12
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-8 lg:px-12 pb-8 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm relative z-10">
        <p className="text-center md:text-left">© {new Date().getFullYear()} Infaqly Philanthropy. All rights reserved. <br className="md:hidden mt-2" /><span className="hidden md:inline"> | </span>Dibuat dengan <span className="text-red-500 mx-1">♥</span> oleh <span className="font-bold text-emerald-400">Bagus Priambudi</span></p>
        <div className="flex items-center gap-8 font-medium">
          <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-emerald-400 transition-colors">Kebijakan Privasi</button>
          <button onClick={() => setIsTermsOpen(true)} className="hover:text-emerald-400 transition-colors">Syarat & Ketentuan</button>
        </div>
      </div>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <BugModal isOpen={isBugOpen} onClose={() => setIsBugOpen(false)} />
    </footer>
  );
}
