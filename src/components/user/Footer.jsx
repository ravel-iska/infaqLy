import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Footer() {
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
            <li><a href="#" className="hover:text-emerald-500 transition-colors">Pusat Bantuan</a></li>
            <li><a href="#" className="hover:text-emerald-500 transition-colors">Cara Donasi</a></li>
            <li><a href="#" className="hover:text-emerald-500 transition-colors">Verifikasi Akun</a></li>
            <li><a href="#" className="hover:text-emerald-500 transition-colors">Syarat & Ketentuan</a></li>
          </ul>
        </div>
        
        <div className="space-y-6">
          <h5 className="font-bold text-on-surface">Kontak</h5>
          <ul className="space-y-3 text-slate-500">
            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">mail</span> info@infaqly.org</li>
            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">call</span> +62 21 555 1234</li>
            <li className="flex items-start gap-2"><span className="material-symbols-outlined text-sm">location_on</span> Jakarta South Quarter, Tower A, Lantai 12</li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-8 lg:px-12 pb-8 border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs">
        <p>© {new Date().getFullYear()} Infaqly Philanthropy. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-emerald-500 transition-colors">Kebijakan Privasi</a>
          <a href="#" className="hover:text-emerald-500 transition-colors">Syarat & Ketentuan</a>
        </div>
      </div>
    </footer>
  );
}
