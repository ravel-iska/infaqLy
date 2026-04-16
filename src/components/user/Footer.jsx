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
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
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
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
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

export default function Footer() {
  const [hasWa, setHasWa] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

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
    <footer className="bg-slate-50 dark:bg-slate-900 w-full rounded-t-3xl mt-auto transition-colors duration-300">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 px-8 lg:px-12 py-16 max-w-7xl mx-auto font-body text-sm leading-relaxed">
        <div className="md:col-span-2 space-y-6">
          <div className="text-xl font-headline font-bold text-emerald-800 dark:text-emerald-500 leading-tight">Infaqly</div>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm">Membangun ekosistem filantropi digital yang amanah, transparan, dan berdampak luas bagi umat.</p>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin);
                toast.success('Tautan disalin ke clipboard!');
              }}
              title="Bagikan Website"
              className="w-10 h-10 rounded-full bg-surface-container dark:bg-slate-800 flex items-center justify-center text-primary dark:text-emerald-400 cursor-pointer hover:bg-primary dark:hover:bg-emerald-500 hover:text-on-primary transition-all"
            >
              <span className="material-symbols-outlined text-sm">share</span>
            </button>
            <a 
              href="/"
              title="Kunjungi Website"
              className="w-10 h-10 rounded-full bg-surface-container dark:bg-slate-800 flex items-center justify-center text-primary dark:text-emerald-400 cursor-pointer hover:bg-primary dark:hover:bg-emerald-500 hover:text-on-primary transition-all"
            >
              <span className="material-symbols-outlined text-sm">language</span>
            </a>
          </div>
        </div>
        
        <div className="space-y-6">
          <h5 className="font-bold text-on-surface dark:text-slate-100 flex items-end h-[28px]">Program</h5>
          <ul className="space-y-4 text-slate-500 dark:text-slate-400">
            <li><Link to="/explore" className="hover:text-emerald-500 transition-colors">Zakat Profesi</Link></li>
            <li><Link to="/explore" className="hover:text-emerald-500 transition-colors">Infaq Pendidikan</Link></li>
            <li><Link to="/explore" className="hover:text-emerald-500 transition-colors">Wakaf Produktif</Link></li>
            <li><Link to="/explore" className="hover:text-emerald-500 transition-colors">Sedekah Pangan</Link></li>
          </ul>
        </div>
        
        <div className="space-y-6">
          <h5 className="font-bold text-on-surface dark:text-slate-100 flex items-end h-[28px]">Bantuan</h5>
          <ul className="space-y-4 text-slate-500 dark:text-slate-400">
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
                className="hover:text-emerald-500 transition-colors"
              >
                Pusat Bantuan
              </a>
            </li>
            <li><Link to="/cara-donasi" className="hover:text-emerald-500 transition-colors">Cara Donasi</Link></li>
          </ul>
        </div>
        
        <div className="space-y-6">
          <h5 className="font-bold text-on-surface dark:text-slate-100 flex items-end h-[28px]">Kontak</h5>
          <ul className="space-y-4 text-slate-500 dark:text-slate-400">
            <li className="flex items-center gap-2 group">
              <span className="material-symbols-outlined text-base">mail</span>
              <a href="mailto:info@infaqly.org" className="hover:text-emerald-500 transition-colors">info@infaqly.org</a>
            </li>
            {hasWa && (
              <li className="flex items-center gap-2 group">
                <span className="material-symbols-outlined text-base">support_agent</span>
                <a href="/api/settings/whatsapp-redirect" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">Tanya via WhatsApp</a>
              </li>
            )}
            <li className="flex items-start gap-2 group">
              <span className="material-symbols-outlined text-base mt-[2px]">location_on</span>
              <a href="https://www.google.com/maps/search/?api=1&query=South+Quarter+Tower+A+Jakarta" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">
                Jakarta South Quarter, Tower A, Lantai 12
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-8 lg:px-12 pb-8 border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-baseline gap-4 text-slate-400 dark:text-slate-500 text-xs">
        <p>© {new Date().getFullYear()} Infaqly Philanthropy. All rights reserved.</p>
        <div className="flex items-baseline gap-6 font-medium">
          <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-emerald-500 transition-colors">Kebijakan Privasi</button>
          <button onClick={() => setIsTermsOpen(true)} className="hover:text-emerald-500 transition-colors">Syarat & Ketentuan</button>
        </div>
      </div>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </footer>
  );
}
