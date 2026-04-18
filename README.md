<div align="center">
  
  <img src="https://raw.githubusercontent.com/ravel-iska/infaqLy/main/public/favicon.svg" alt="InfaqLy Logo" width="180" height="180"/>

  <h1>✨ InfaqLy ✨<br/><sub>Revolusi Crowdfunding Filantropi Islam</sub></h1>

  <p>
    <b>Platform penggalangan dana digital (Infaq & Wakaf) yang transparan, ultra-cepat, dan berteknologi tinggi.</b>
  </p>

  <br />

  <img src="https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge&logo=rocket" alt="Status" />
  <img src="https://img.shields.io/badge/Architecture-MERN_Monolithic-8A2BE2?style=for-the-badge&logo=databricks" alt="Architecture" />
  <img src="https://img.shields.io/badge/Performance-Lighthouse_Target_90%2B-00C853?style=for-the-badge&logo=lighthouse" alt="Performance" />

  <br /><br />

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](#)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](#)

  <br />
</div>

<hr />

## 📖 Tentang InfaqLy

**InfaqLy** dirancang secara spesifik sebagai jembatan **Crowdfunding Syariah**. Setiap donasi yang digalang dari *Crowd* dipetakan demi mendukung kampanye sosial, pembangunan masjid, kesehatan, atau santunan dengan sistem **pembukuan *real-time***.

Sistem telah dirombak penuh untuk performa maksimal ("Zero JS bloat", Gzip/Brotli compression, serta lazy-loaded Material Symbols).

<br />

## 🚀 Fitur Unggulan

| Ekosistem | Keunggulan InfaqLy |
| :--- | :--- |
| **💳 Dynamic Payment Gateway** | Didukung algoritma *Midtrans* yang mampu memproses **Virtual Account (VA), e-Wallet (GoPay, OVO), & QRIS** secara *real-time*. |
| **🛡️ Anti-Spam OTP (WhatsApp)** | Verifikasi *Fonnte API* mencegah pembuatan akun anonim/bot, memastikan nomor HP *Crowd* benar-benar terverifikasi. |
| **📜 Sertifikat Amal Otomatis** | Mencetak *Sertifikat Penghargaan PDF* eksklusif atas nama donatur seketika. Meningkatkan *trust* & psikologi donatur. |
| **⚡ Ultra-Optimized UI** | Menggunakan arsitektur *Vite* dengan pemangkasan *bundle*, **Pemuatan Berbasis GZIP/Brotli**, dan optimasi Lighthouse agar aplikasi berjalan sangat mulus di jaringan lokal. |
| **🎛️ Sistem Aksesibilitas Modern** | UI dibalut jubah *Glassmorphism* dan mode gelap, mematuhi standar *Aria-Labels* agar aksesibilitas memanjakan semua kalangan. |

<br />

## 📥 Panduan Setup Cepat / Lokal

Sistem ini sangat fleksibel dan dapat dieksekusi di MacOS / Windows / Linux.
**Syarat Wajib:** `Node.js (v20+)` & Database `PostgreSQL` (Bisa lokal atau Cloud).

### 1. Kloning Repositori
```bash
git clone https://github.com/ravel-iska/infaqLy.git
cd infaqLy
npm install
```
*(Dependencies Backend dan Frontend akan terunduh otomatis melalui postinstall)*

### 2. Konfigurasi Environment (`.env`)
Salin template konfigurasi ke engine lokal:
```bash
cd server
cp .env.example .env
```
Lalu pastikan Anda mengisi Variabel Esensial di dalam file `server/.env` Anda:
```env
# Koneksi Basis Data
DATABASE_URL="postgres://username:password@localhost:5432/infaqly_db" 

# Keamanan Internal JWT
JWT_SECRET="sandi_rahasia_sistem_anda"

# CDN / Penyimpanan Media
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### 3. Migrasi Skema Basis Data Drizzle
Jalankan migrasi skema tabel PostgreSQL:
```bash
npm --prefix server run db:push
npm --prefix server run db:seed
```

### 4. Nyalakan Reaktor!
Dengan teknologi Concurrent, Anda menyalakan Sistem Frontend (Vite), Backend API (Express), dan Studio Database (Drizzle) serentak:
```bash
npm run dev
```

Port Default Berjalan:
- 💻 **Aplikasi Pengguna & UI:** `http://localhost:5173`
- ⚙️ **Urat Nadi API / Endpoint:** `http://localhost:5000`
- 🗄️ **Visual Drizzle Studio:** `https://local.drizzle.studio`

<br />

## ☁️ Petunjuk Distribusi (*Cloud Deployment*)
Proyek ini dibuat untuk kesiapan *Production Ready* (misalnya via Railway / Render):

1. **GitHub Flow**: Lakukan *push* ke repositori Anda.
2. **Setup Railway**: Hubungkan akun GitHub dengan Platform Railway.
3. Tambahkan layanan `PostgreSQL` dari dalam Dashboard.
4. Di bagian *Variables*, masukkan `DATABASE_URL` (Reference), `JWT_SECRET`, dan `PORT=5000`.
5. Railway akan secara otomatis memicu `npm run build` dan **Brotli Compress Plugin** akan mengecilkannya secara ekstrim.

<br />

<div align="center">
<b>Menembus Batas Donasi Era Digital dengan Transparansi Tanpa Syarat</b><br>
Hak Cipta © 2026 InfaqLy. 
</div>
