import React from 'react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface dark:bg-slate-900 relative overflow-hidden px-6 transition-colors duration-300">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 dark:bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 dark:bg-emerald-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-lg mx-auto bg-surface-container-lowest/70 dark:bg-slate-800/70 backdrop-blur-xl border border-outline-variant/30 dark:border-slate-700 p-10 rounded-[32px] shadow-soft dark:shadow-black/20">
        
        {/* Animated Gears */}
        <div className="flex justify-center items-center gap-1 mb-8">
          <span className="material-symbols-outlined text-[64px] text-primary dark:text-emerald-400 animate-[spin_4s_linear_infinite]">settings</span>
          <span className="material-symbols-outlined text-[42px] text-slate-400 dark:text-slate-500 animate-[spin_3s_linear_infinite_reverse] -ml-4 -mt-6">settings</span>
        </div>

        <h1 className="text-3xl font-extrabold text-on-surface dark:text-white tracking-tight mb-4 font-headline">
          Mode <span className="text-primary dark:text-emerald-400">Pemeliharaan</span>
        </h1>
        
        <p className="text-on-surface-variant dark:text-slate-300 leading-relaxed mb-8">
          Assalamu'alaikum. Saat ini sistem <strong>infaqLy</strong> sedang dalam proses peningkatan layanan sementara. Silakan coba kembali beberapa saat lagi.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-emerald-900/30 rounded-full text-primary dark:text-emerald-400 text-sm font-semibold border border-primary/20 dark:border-emerald-500/30">
          <span className="material-symbols-outlined animate-pulse text-[18px]">engineering</span>
          System Updating...
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center text-sm font-medium text-slate-500 dark:text-slate-600">
        &copy; {new Date().getFullYear()} infaqLy — Platform Donasi Digital
      </div>
    </div>
  );
}
