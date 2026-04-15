import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-user-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold font-heading text-user-text">
              <span className="text-2xl">🕌</span>
              <span>infaqLy</span>
            </Link>
            <p className="mt-3 text-sm text-user-text-secondary leading-relaxed">
              Platform donasi infaq & wakaf digital yang terpercaya. 
              Salurkan kebaikan Anda dengan mudah dan transparan.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-user-text mb-4">Navigasi</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-user-text-secondary hover:text-user-accent transition-colors">Beranda</Link></li>
              <li><Link to="/explore" className="text-sm text-user-text-secondary hover:text-user-accent transition-colors">Jelajahi Program</Link></li>
              <li><Link to="/login" className="text-sm text-user-text-secondary hover:text-user-accent transition-colors">Masuk</Link></li>
              <li><Link to="/register" className="text-sm text-user-text-secondary hover:text-user-accent transition-colors">Daftar</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-user-text mb-4">Kontak</h4>
            <ul className="space-y-2 text-sm text-user-text-secondary">
              <li>📧 info@infaqly.id</li>
              <li>📱 +62 812-3456-7890</li>
              <li>📍 Indonesia</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-user-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-user-text-muted">
            © {new Date().getFullYear()} infaqLy. Seluruh hak cipta dilindungi.
          </p>
          <p className="text-xs text-user-text-muted flex items-center gap-1">
            Dibuat dengan <Heart size={12} className="text-danger fill-danger" /> oleh Bagus Priambudi di Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
