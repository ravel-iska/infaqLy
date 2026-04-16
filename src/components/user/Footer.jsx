import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/services/api';

function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up relative">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-headline text-xl font-bold text-on-surface">Syarat & Ketentuan</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto font-body text-slate-600 text-sm space-y-4 shadow-inner">
          <p>Selamat datang di InfaqLy. Dengan menggunakan layanan platform ini, Anda menyetujui seluruh syarat dan ketentuan berikut:</p>
          
          <h4 className="font-bold text-slate-800 text-base mt-6">1. Penggunaan Layanan</h4>
          <p>Platform InfaqLy ditujukan semata-mata untuk memfasilitasi transaksi donasi (Infaq, Sedekah, Wakaf) antara donatur dan program yang sah. Penggunaan platform untuk tujuan penipuan atau pencucian uang dilarang keras.</p>
          
          <h4 className="font-bold text-slate-800 text-base mt-6">2. Transparansi Dana</h4>
          <p>Semua dana yang disalurkan melalui platform ini dicatat secara transparan dan dilaporkan secara berkala kepada donatur. InfaqLy berhak memotong sebagian kecil dana (jika disetujui sebelumnya) untuk biaya operasional server dan payment gateway sesuai ketentuan yang wajar.</p>
          
          <h4 className="font-bold text-slate-800 text-base mt-6">3. Privasi Data</h4>
          <p>Data pribadi Anda (Nama, Email, dan Nomor WhatsApp) akan dijaga kerahasiaannya dan hanya digunakan untuk keperluan administratif donasi (seperti notifikasi kuitansi dan progres program). Kami tidak akan menjual atau membagikan data kepada pihak ketiga.</p>
          
          <h4 className="font-bold text-slate-800 text-base mt-6">4. Pengembalian Dana (Refund)</h4>
          <p>Dana donasi yang telah terkonfirmasi sukses secara prinsip tidak dapat dikembalikan (non-refundable), kecuali terbukti terjadi kesalahan teknis dari pihak sistem kami (contoh: pembayaran ganda/double charge).</p>
          
          <div className="pt-4 border-t border-slate-100 mt-6 bg-amber-50/50 p-4 rounded-xl text-amber-900/80 italic text-xs">
            InfaqLy berhak setiap saat mengubah atau memperbarui halaman Syarat & Ketentuan ini tanpa pemberitahuan sebelumnya. Pastikan Anda membacanya secara berkala.
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0">
          <button onClick={onClose} className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm">Saya Mengerti</button>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const [waUrl, setWaUrl] = useState('');
  const [phone, setPhone] = useState('+62 21 555 1234');
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get('/settings/public');
        if (data.waUrl) setWaUrl(data.waUrl);
        if (data.phone) setPhone(data.phone);
      } catch (err) {}
    };
    fetchSettings();
  }, []);
  return (
    <footer className="bg-slate-50 w-full rounded-t-3xl mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 lg:px-12 py-16 max-w-7xl mx-auto font-body text-sm leading-relaxed">
        <div className="space-y-6">
          <div className="text-xl font-headline font-bold text-emerald-800">Infaqly</div>
          <p className="text-slate-500">Membangun ekosistem filantropi digital yang amanah, transparan, dan berdampak luas bagi umat.</p>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin);
                toast.success('Tautan disalin ke clipboard!');
              }}
              title="Bagikan Website"
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-on-primary transition-all"
            >
              <span className="material-symbols-outlined text-sm">share</span>
            </button>
            <a 
              href="/"
              title="Kunjungi Website"
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-on-primary transition-all"
            >
              <span className="material-symbols-outlined text-sm">language</span>
            </a>
          </div>
        </div>
        
        <div className="space-y-6">
          <h5 className="font-bold text-on-surface">Program</h5>
          <ul className="space-y-3 text-slate-500">
            <li><Link to="/explore" className="hover:text-emerald-500 transition-colors">Zakat Profesi</Link></li>
            <li><Link to="/explore" className="hover:text-emerald-500 transition-colors">Infaq Pendidikan</Link></li>
            <li><Link to="/explore" className="hover:text-emerald-500 transition-colors">Wakaf Produktif</Link></li>
            <li><Link to="/explore" className="hover:text-emerald-500 transition-colors">Sedekah Pangan</Link></li>
          </ul>
        </div>
        
        <div className="space-y-6">
          <h5 className="font-bold text-on-surface">Bantuan</h5>
          <ul className="space-y-3 text-slate-500">
            {waUrl ? (
              <li><a href={waUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">Pusat Bantuan</a></li>
            ) : null}
            <li><Link to="/cara-donasi" className="hover:text-emerald-500 transition-colors">Cara Donasi</Link></li>
            <li><button onClick={() => setIsTermsOpen(true)} className="hover:text-emerald-500 transition-colors text-left">Syarat & Ketentuan</button></li>
          </ul>
        </div>
        
        <div className="space-y-6">
          <h5 className="font-bold text-on-surface">Kontak</h5>
          <ul className="space-y-3 text-slate-500">
            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">mail</span> info@infaqly.org</li>
            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">call</span> {phone}</li>
            <li className="flex items-start gap-2"><span className="material-symbols-outlined text-sm">location_on</span> Jakarta South Quarter, Tower A, Lantai 12</li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-8 lg:px-12 pb-8 border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs">
        <p>© {new Date().getFullYear()} Infaqly Philanthropy. All rights reserved.</p>
        <div className="flex gap-6">
          <button onClick={() => setIsTermsOpen(true)} className="hover:text-emerald-500 transition-colors">Kebijakan Privasi</button>
          <button onClick={() => setIsTermsOpen(true)} className="hover:text-emerald-500 transition-colors">Syarat & Ketentuan</button>
        </div>
      </div>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </footer>
  );
}
