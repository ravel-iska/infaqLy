import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '@/components/user/Navbar';
import Footer from '@/components/user/Footer';
import api from '@/services/api';

function FloatingWA() {
  const [hasWa, setHasWa] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get('/settings/public');
        if (data.hasWa) setHasWa(data.hasWa);
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  const handleClick = (e) => {
    if (!hasWa) {
      e.preventDefault();
      alert('Maaf, nomor Bantuan/WhatsApp admin belum dikonfigurasi di Pengaturan.');
    }
  };

  if (!hasWa) return null; // Hide totally if the admin wiped out the Help Center number

  return (
    <a 
      href="/api/settings/whatsapp-redirect"
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      title="Hubungi Pusat Bantuan"
      className="fixed bottom-6 right-6 z-[90] bg-emerald-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-user-lg hover:bg-emerald-600 hover:scale-110 transition-all cursor-pointer group"
    >
      {/* Tooltip */}
      <div className="absolute right-[calc(100%+15px)] bg-surface-container-lowest text-on-surface text-xs font-bold px-4 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-200">
        Pusat Bantuan
      </div>
      <span className="material-symbols-outlined text-3xl">chat</span>
      
      {/* Pulse effect */}
      <span className="absolute w-full h-full bg-emerald-500 rounded-full animate-ping opacity-20 -z-10"></span>
    </a>
  );
}

export default function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col user-bg">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FloatingWA />
    </div>
  );
}
