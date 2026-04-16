import { Link } from 'react-router-dom';

export default function HowToDonatePage() {
  return (
    <div className="animate-fade-in bg-surface font-body text-on-surface min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-bold tracking-widest uppercase mb-6">
            Panduan
          </span>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface mb-6">
            Cara Mudah Berdonasi
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
            Ikuti langkah-langkah sederhana berikut untuk mulai menyalurkan kebaikan Anda melalui platform InfaqLy.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          
          <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[2.5rem] ambient-shadow border border-white/40 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-20 h-20 flex-shrink-0 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center font-headline text-3xl font-bold">
              1
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">Login atau Daftar Akun</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Untuk menjaga keamanan dan transparansi, Anda diwajibkan untuk memiliki akun. Jika belum punya, silakan <Link to="/register" className="text-primary hover:underline font-medium">Daftar di sini</Link>. Jika sudah punya, silakan <Link to="/login" className="text-primary hover:underline font-medium">Login</Link> menggunakan email atau WhatsApp Anda.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[2.5rem] ambient-shadow border border-white/40 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-20 h-20 flex-shrink-0 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center font-headline text-3xl font-bold">
              2
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">Pilih Program Kebaikan</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Kunjungi halaman <Link to="/explore" className="text-primary hover:underline font-medium">Jelajahi</Link> untuk melihat berbagai program Infaq dan Wakaf yang sedang aktif. Anda dapat memfilter program berdasarkan kategori untuk mempermudah pencarian.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[2.5rem] ambient-shadow border border-white/40 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-20 h-20 flex-shrink-0 bg-tertiary-container text-on-tertiary-container rounded-full flex items-center justify-center font-headline text-3xl font-bold">
              3
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">Masukkan Nominal Donasi</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Setelah memilih program, klik "Donasi Sekarang". Anda akan diminta untuk memasukkan jumlah donasi yang ingin disalurkan. Anda juga bisa memilih untuk anonim jika tidak ingin nama Anda ditampilkan.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[2.5rem] ambient-shadow border border-white/40 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-20 h-20 flex-shrink-0 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center font-headline text-3xl font-bold">
              4
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">Pilih Metode Pembayaran</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Kami menyediakan berbagai metode pembayaran digital yang aman melalui Midtrans (Gopay, QRIS, Virtual Account BCA/Mandiri/BNI, dll). Selesaikan pembayaran sesuai instruksi yang diberikan di layar.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[2.5rem] ambient-shadow border border-white/40 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-20 h-20 flex-shrink-0 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center font-headline text-3xl font-bold">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">Selesai! Terima Kasih</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Alhamdulillah! Donasi Anda berhasil disalurkan. Anda akan menerima notifikasi melalui WhatsApp dan laporan perkembangan program akan kami kirimkan secara berkala.
              </p>
            </div>
          </div>

        </div>

        <div className="mt-16 text-center">
          <Link to="/explore" className="btn-admin-primary px-8 py-4 rounded-xl text-lg font-bold inline-block shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            Mulai Berdonasi Sekarang
          </Link>
        </div>

      </div>
    </div>
  );
}
