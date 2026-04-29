import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

export default function MinimalLayout() {
  const { isUserDark } = useTheme();
  return (
    <div className={`min-h-screen font-body flex flex-col transition-colors duration-300 ${isUserDark ? 'dark' : ''}`}>

      {/* Background — light: soft mint, dark: deep emerald */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950 dark:via-slate-900 dark:to-teal-950 transition-colors duration-500"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-200/30 dark:bg-emerald-500/10 rounded-full blur-[120px] transition-colors duration-500"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-200/20 dark:bg-teal-400/10 rounded-full blur-[100px] transition-colors duration-500"></div>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(16,185,129,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      </div>

      <header className="py-6 px-8 absolute top-0 left-0 w-full z-10 flex justify-center md:justify-start">
        <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold font-headline text-emerald-600 dark:text-emerald-400">
          <span className="material-symbols-outlined text-3xl">volunteer_activism</span>
          <span className="tracking-tight text-slate-800 dark:text-white">Infaqly</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-24 relative z-10 overflow-hidden">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

