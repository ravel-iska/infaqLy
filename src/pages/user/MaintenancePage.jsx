import React from 'react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center user-bg relative overflow-hidden px-6">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-user-accent/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-user-accent/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-lg mx-auto bg-white/70 backdrop-blur-xl border border-user-border p-10 rounded-[32px] shadow-soft">
        
        {/* Animated Gears */}
        <div className="flex justify-center items-center gap-1 mb-8">
          <span className="material-symbols-outlined text-[64px] text-user-accent animate-[spin_4s_linear_infinite]">settings</span>
          <span className="material-symbols-outlined text-[42px] text-user-text-muted animate-[spin_3s_linear_infinite_reverse] -ml-4 -mt-6">settings</span>
        </div>

        <h1 className="text-3xl font-extrabold text-user-text tracking-tight mb-4">
          Mode <span className="text-user-accent">Pemeliharaan</span>
        </h1>
        
        <p className="text-user-text-secondary leading-relaxed mb-8">
          Assalamu'alaikum. Saat ini sistem <strong>infaqLy</strong> sedang dalam proses peningkatan layanan sementara. Silakan coba kembali beberapa saat lagi.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-user-accent/10 rounded-full text-user-accent text-sm font-semibold border border-user-accent/20">
          <span className="material-symbols-outlined animate-pulse text-[18px]">engineering</span>
          System Updating...
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center text-sm font-medium text-user-text-muted/60">
        &copy; {new Date().getFullYear()} infaqLy — Platform Donasi Digital
      </div>
    </div>
  );
}
