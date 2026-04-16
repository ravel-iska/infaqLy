import { Link } from 'react-router-dom';

export default function HowToDonatePage() {
  return (
    <div className="animate-fade-in bg-surface dark:bg-slate-900 font-body text-on-surface dark:text-slate-200 min-h-screen pt-24 pb-20 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-container dark:bg-emerald-900/50 text-on-primary-container dark:text-emerald-400 text-xs font-bold tracking-widest uppercase mb-6">
            Panduan
          </span>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface dark:text-white mb-6">
            Cara Mudah Berdonasi
          </h1>
          <p className="text-lg text-on-surface-variant dark:text-slate-400 max-w-2xl mx-auto">
            Ikuti langkah-langkah sederhana berikut untuk mulai menyalurkan kebaikan Anda melalui platform InfaqLy.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-8 md:p-10 rounded-[2.5rem] ambient-shadow border border-white/40 dark:border-slate-700 flex flex-col md:flex-row gap-8 items-center transition-all duration-300 relative overflow-hidden group hover:border-primary/30 dark:hover:border-emerald-500/30">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary/20 dark:bg-emerald-500/20 group-hover:bg-primary dark:group-hover:bg-emerald-500 transition-colors"></div>
            <div className="w-20 h-20 flex-shrink-0 bg-primary-container dark:bg-emerald-900/40 text-on-primary-container dark:text-emerald-400 rounded-full flex items-center justify-center font-headline text-3xl font-bold shadow-inner">
              1
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 text-on-surface dark:text-white">Login atau Daftar Akun</h3>
              <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
                Untuk menjaga keamanan dan transparansi, Anda diwajibkan untuk memiliki akun. Jika belum punya, silakan <Link to="/register" className="text-primary dark:text-emerald-400 hover:underline font-bold">Daftar di sini</Link>. Jika sudah punya, silakan <Link to="/login" className="text-primary dark:text-emerald-400 hover:underline font-bold">Login</Link> menggunakan email atau WhatsApp Anda.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-slate-800 p-8 md:p-10 rounded-[2.5rem] ambient-shadow border border-white/40 dark:border-slate-700 flex flex-col md:flex-row gap-8 items-center transition-all duration-300 relative overflow-hidden group hover:border-secondary/30 dark:hover:border-teal-500/30">
            <div className="absolute top-0 left-0 w-2 h-full bg-secondary/20 dark:bg-teal-500/20 group-hover:bg-secondary dark:group-hover:bg-teal-500 transition-colors"></div>
            <div className="w-20 h-20 flex-shrink-0 bg-secondary-container dark:bg-teal-900/40 text-on-secondary-container dark:text-teal-400 rounded-full flex items-center justify-center font-headline text-3xl font-bold shadow-inner">
              2
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 text-on-surface dark:text-white">Pilih Program Kebaikan</h3>
              <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
                Kunjungi halaman <Link to="/explore" className="text-primary dark:text-emerald-400 hover:underline font-bold">Jelajahi</Link> untuk melihat berbagai program Infaq dan Wakaf yang sedang aktif. Anda dapat memfilter program berdasarkan kategori untuk mempermudah pencarian.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-slate-800 p-8 md:p-10 rounded-[2.5rem] ambient-shadow border border-white/40 dark:border-slate-700 flex flex-col md:flex-row gap-8 items-center transition-all duration-300 relative overflow-hidden group hover:border-tertiary/30 dark:hover:border-indigo-500/30">
            <div className="absolute top-0 left-0 w-2 h-full bg-tertiary/20 dark:bg-indigo-500/20 group-hover:bg-tertiary dark:group-hover:bg-indigo-500 transition-colors"></div>
            <div className="w-20 h-20 flex-shrink-0 bg-tertiary-container dark:bg-indigo-900/40 text-on-tertiary-container dark:text-indigo-400 rounded-full flex items-center justify-center font-headline text-3xl font-bold shadow-inner">
              3
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 text-on-surface dark:text-white">Masukkan Nominal Donasi</h3>
              <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
                Setelah memilih program, klik "Donasi Sekarang". Anda akan diminta untuk memasukkan jumlah donasi yang ingin disalurkan. Anda juga bisa memilih untuk anonim jika tidak ingin nama Anda ditampilkan.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-slate-800 p-8 md:p-10 rounded-[2.5rem] ambient-shadow border border-white/40 dark:border-slate-700 flex flex-col md:flex-row gap-8 items-center transition-all duration-300 relative overflow-hidden group hover:border-primary/30 dark:hover:border-emerald-500/30">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary/20 dark:bg-emerald-500/20 group-hover:bg-primary dark:group-hover:bg-emerald-500 transition-colors"></div>
            <div className="w-20 h-20 flex-shrink-0 bg-primary-container dark:bg-emerald-900/40 text-on-primary-container dark:text-emerald-400 rounded-full flex items-center justify-center font-headline text-3xl font-bold shadow-inner">
              4
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 text-on-surface dark:text-white">Pilih Metode Pembayaran</h3>
              <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
                Kami menyediakan berbagai metode pembayaran digital yang aman melalui Midtrans (Gopay, QRIS, Virtual Account BCA/Mandiri/BNI, dll). Selesaikan pembayaran sesuai instruksi yang diberikan di layar.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-slate-800 p-8 md:p-10 rounded-[2.5rem] ambient-shadow border border-white/40 dark:border-slate-700 flex flex-col md:flex-row gap-8 items-center transition-all duration-300 relative overflow-hidden group hover:border-emerald-500/50">
            <div className="absolute inset-x-0 -bottom-4 h-10 w-full bg-success/20 dark:bg-success/10 blur-xl"></div>
            <div className="w-20 h-20 flex-shrink-0 bg-success/10 dark:bg-success/20 text-success rounded-full flex items-center justify-center font-headline text-3xl font-bold shadow-inner relative z-10">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-3 text-on-surface dark:text-white">Selesai! Terima Kasih</h3>
              <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
                Alhamdulillah! Donasi Anda berhasil disalurkan. Anda akan menerima notifikasi melalui WhatsApp dan laporan perkembangan program akan kami kirimkan secara berkala.
              </p>
            </div>
          </div>

        </div>

        <div className="mt-16 text-center">
          <Link to="/explore" className="btn-admin-primary px-8 py-4 rounded-xl text-lg font-bold inline-block shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 dark:shadow-emerald-900/20 border border-transparent dark:border-emerald-500/20">
            Mulai Berdonasi Sekarang
          </Link>
        </div>

      </div>
    </div>
  );
}
