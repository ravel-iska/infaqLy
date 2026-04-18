<div align="center">
  
  <img src="https://raw.githubusercontent.com/ravel-iska/infaqLy/main/public/logo.png" alt="InfaqLy Logo" width="200" height="200"/>

  <h1>✨ InfaqLy ✨<br/><sub>The Genesis of Syariah Crowdfunding</sub></h1>

  <p>
    <b>Merevolusi penggalangan dana umat melalui ekosistem digital <i>(Crowdfunding)</i> yang transparan, minim potongan, dan berteknologi tinggi.</b>
  </p>

  <br />

  <img src="https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge&logo=rocket" alt="Status" />
  <img src="https://img.shields.io/badge/Architecture-MERN_Monolithic-8A2BE2?style=for-the-badge&logo=databricks" alt="Architecture" />
  <img src="https://img.shields.io/badge/Category-Islamic_Crowdfunding-FF6B6B?style=for-the-badge&logo=awsorganizations" alt="Category" />

  <br /><br />

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](#)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](#)

  <br />

  [Tampilan Antarmuka](#-galeri-antarmuka-uiux) • 
  [Fitur Utama](#-katalis-penggalangan-dana) • 
  [Instalasi Lokal](#-panduan-instalasi-lokal) • 
  [Cloud Deployment](#%EF%B8%8F-panduan-cloud-deployment)
</div>

<hr />

## 📖 Tentang Aplikasi Crowdfunding Jaringan Umat

Berbeda dengan platform konvensional, **InfaqLy** dirancang secara spesifik sebagai jembatan **Crowdfunding Syariah**. Setiap dana yang digalang dari *Crowd* (masyarakat luas) secara langsung dipetakan demi mendukung kampanye sosial, pembangunan masjid, kesehatan, atau santunan yatim dengan pembukuan real-time. Tidak ada lagi kotak amal kayu yang tak transparan; selamat datang di ekosistem digital filantropi Islam modern.

<br />

## 📸 Galeri Antarmuka (UI/UX)

Sistem didesain dengan prinsip UI sekalas *Startup Fintech* untuk membangun kepercayaan penuh setiap donatur. 

### 1. Halaman Utama (Beranda / Landing Page)
<div align="center">
  <img src="docs/images/1_homepage.png" alt="Homepage InfaqLy" width="800" style="border-radius:10px; border:1px solid #ccc;" />
  <p><i>Dirancang menggunakan teknik komposisi warna elegan yang ramah, dilengkapi dengan visual pemantik yang menggugah penderma.</i></p>
</div>

### 2. Eksplorator & Detail Kampanye
<div align="center">
  <img src="docs/images/2_detail.png" alt="Detail Kampanye InfaqLy" width="800" style="border-radius:10px; border:1px solid #ccc;" />
  <p><i>Kalkulasi live-tracking donasi. Pendonator bisa memonitor jejak uang sedekahnya kapanpun.</i></p>
</div>

### 3. Ekosistem Registrasi Tahan Banting (Anti-Spam)
<div align="center">
  <img src="docs/images/3_register.png" alt="Halaman Register" width="800" style="border-radius:10px; border:1px solid #ccc;" />
  <p><i>Verifikasi ganda integrasi WhatsApp API memblokir otomatis pendaftaran nomor seluler fiktif.</i></p>
</div>

### 4. Pusat Kendali Administrator (Dasbor)
<div align="center">
  <img src="docs/images/4_admin.png" alt="Admin Dashboard" width="800" style="border-radius:10px; border:1px solid #ccc;" />
  <p><i>Sang pengurus (Admin) dibekali dasbor komposit arsitektur Bento-Box (Papan Kartu) untuk menginspeksi segala transaksi Midtrans secara absolut.</i></p>
</div>

<br />

## 🚀 Katalis Penggalangan Dana

| Kategori Ekosistem | Keunggulan InfaqLy |
| :--- | :--- |
| 💸 **Dynamic Payment Gateway** | Didukung algoritma *Midtrans* yang mampu melacak dan memverifikasi ratusan transfer bank (VA), e-Wallet (GoPay, OVO), & QRIS dari berbagai *donatur* secara serentak (*real-time*). |
| 🛡️ **Anti-Spam OTP (WhatsApp)** | Menghapus era login email via link! Menggunakan tembakan kilat *Fonnte API* untuk melacak nomor HP asli masyarakat (Crowd) dan menghanguskan akun-akun palsu pencari celah. |
| 🎫 **Sertifikat Amal Generatif** | Mekanisme cerdas yang mencetak *Sertifikat Penghargaan PDF* eksklusif atas nama donatur secara seketika. Meningkatkan rasa bangga dan memicu efek psikologi "Viral Crowdfunding". |
| 💎 **UI/UX Sekelas Startup** | Dilapisi jubah *Glassmorphism* dan mode gelap premium dengan *Zero-Jitter Animations* berkat arsitektur *Tailwind*. Meyakinkan pengguna hanya dengan lirikan pertama. |
| 🎛️ **Omni-Admin Dashboard** | Sebagai komandan sistem, Admin dapat melacak analitik donasi *live*, mencairkan dana (*withdrawal*), dan merubah setir mesin API Utama hanya dari layar tablet—tanpa mengubah script `.env`. |

<br />

## 📥 Panduan Instalasi Lokal 
Sistem Crowdfunding ini amat fleksibel dan dapat dieksekusi di OS mana pun (Windows / macOS / Linux).
> **Syarat Wajib:** `Node.js (v20+)` & Mesin Database `PostgreSQL`.

<details>
<summary><b>1. 📡 Kloning Ruang Angkasa (Instalasi Root)</b></summary>
<br/>

Buka gerbang *Terminal* (Bash) atau *PowerShell* (Windows) milik Anda:

```bash
git clone https://github.com/ravel-iska/infaqLy.git
cd infaqLy

# Menarik masuk seluruh dependensi Frontend dan Backend sekaligus
npm install
npm run postinstall
```
</details>

<details>
<summary><b>2. 🔑 Perakitan Kunci Rahasia (.env)</b></summary>
<br/>

Meniru variabel *environment* ke dapur pacu utama:

**Untuk Pengguna Windows (Command Prompt/PowerShell):**
```cmd
cd server
copy .env.example .env
```
**Untuk Pengguna macOS / Linux:**
```bash
cd server
cp .env.example .env
```

Buka dan penuhi `.env` dengan takdir spesifikasi berikut:
```env
# URL Database Postgres Anda
DATABASE_URL="postgres://username:password@localhost:5432/infaqly_db" 

# Jaring perlindungan Token JWT (Harus diisi teks rumit)
JWT_SECRET="sandi_kripto_kompleks_anda_di_sini"

# Cloudinary - Pustaka Penyimpanan Awang (Untuk gambar kampanye)
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```
</details>

<details>
<summary><b>3. 🧬 Restorasi Model Data (Drizzle)</b></summary>
<br/>

*PostgreSQL* wajib menyala! Masuk ke pangkal akar direktori (`infaqLy`), lalu tempa tabel arsitektur *crowdfunding*-nya:
```bash
npm --prefix server run db:push
npm --prefix server run db:seed
```
</details>

<details>
<summary><b>4. ⚡ Reaktor Mesin Dihidupkan (One-Click Start)</b></summary>
<br/>

Skrip ajaib *Concurrent* memungkinkan Anda menyalakan semua reaktor (FE, BE, dan studio DB) dalam 1 baris perintah:

```bash
npm run dev
```

Sistem mengudara, cek kanal-kanal ini di browser kesayangan Anda:
* ✨ **Portal Pengguna (Crowd):** [`http://localhost:5173`](http://localhost:5173)
* ⚙️ **Urat Nadi API Backend:** `http://localhost:5000`
* 📊 **Studio Visual Tabel Database:** [`https://local.drizzle.studio`](https://local.drizzle.studio)
</details>

<br />

## ☁️ Panduan Cloud Deployment

Menciptakan situs penggalangan berskala massal tidak pernah semudah melempar batu. InfaqLy sangat kompatibel dengan kontainer nir-server *(Serverless)* dari [Railway.app](https://railway.app/).

1. 📂 **Ambulans GitHub**: Dorong (`git push`) *update* proyek ke repositori pribadi.
2. 🚉 **Terminal Railway**: Registrasi ke Platform Railway, lakukan `New Project` > `Deploy from GitHub repo`, temukan *"infaqLy"*.
3. 🗄️ **Pusat Logistik Data**: Klik logo `+ / Create` > `Database` > pilih `Add PostgreSQL`.
4. 🔐 **Variabel Spesifik Produksi**: Anda cuma perlu menginput ini:
   - `DATABASE_URL` (Reference Variable dari PostgreSQL)
   - `JWT_SECRET` (Karangan Password Liar)
   - `PORT` (Isi `5000`)
   - `NODE_ENV` (Isi `production`)
5. 🌍 **Aksi Penembakan**: Mesin Railway akan merakit skrip `npm run build` dan `npm start`. Set domain, maka aplikasi Anda siap membumi! 

<br />

## 🛡️ Keamanan Sistem

* **Midtrans Webhook Anti-Spoofing:** Semua notifikasi pembayaran hanya dapat ditangkap jika membawa SHA-512 Signature Key asli perbankan.
* **B-Tree SQL Indexes:** Seluruh tabel sentral diinjeksi arsitektur _Indexing_ guna menekan lag (bottleneck lag free architecture).
* **GZIP Vacuum Compression:** Ukuran perpadian data lintas jaringan diringkas sampai 70% secara serentak demi _bandwidth_ irit di ponsel jamaah.

<br />

<div align="center">
<b>Menembus Masa Depan Crowdfunding dengan Amal Jariyah</b><br>
Hak Cipta © 2026. Dikembangkan sebagai Artefak Karya Akademis (Skripsi). <br>All Rights Reserved.
</div>
