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

  [Fitur Utama](#-katalis-penggalangan-dana) • 
  [Instalasi Lokal](#-panduan-instalasi-lokal) • 
  [Cloud Deployment](#%EF%B8%8F-panduan-cloud-deployment) • 
  [Sistem Keamanan](#-keamanan-kelas-berlian)

</div>

<hr />

## 📖 Tentang Aplikasi Crowdfunding Jaringan Umat

Berbeda dengan platform konvensional, **InfaqLy** dirancang secara spesifik sebagai jembatan **Crowdfunding Syariah**. Setiap dana yang digalang dari *Crowd* (masyarakat luas) secara langsung dipetakan demi mendukung kampanye sosial, pembangunan masjid, kesehatan, atau santunan yatim dengan pembukuan real-time. Tidak ada lagi kotak amal kayu yang tak transparan; selamat datang di kotak amal dunia digital.

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

<details>
<summary><b>Lihat Panduan Singkat Railway (7 Langkah)</b></summary>
<br/>

1. 📂 **Ambulans GitHub**: Dorong (`git push`) *update* proyek sempurna ini ke rumah GitHub Pribadi Anda terlebih dahulu.
2. 🚉 **Terminal Railway**: Registrasi ke Platform Railway, lakukan `New Project` > `Deploy from GitHub repo`, temukan *"infaqLy"*.
3. 🗄️ **Pusat Logistik Data**: Jangan langsung tekan Deploy! Ke beranda proyek Railway Anda, klik logo `+ / Create` > `Database` > pilih `Add PostgreSQL`.
4. 🔗 **Injeksi Nadi Database**:
   - Ketuk pilar layanan **Web App (infaqLy)** Anda.
   - Pelesir ke tab **Variables**.
   - Pilih **Reference Variable**, tujuannya adalah menyambungkan nilai URL dengan kotak penyedia data PostgreSQL.
5. 🔐 **Variabel Spesifik Produksi**: Anda cuma perlu menginput ini:
   - `JWT_SECRET` (Karangan Password Liar)
   - `PORT` (Isi `5000`)
   - `NODE_ENV` (Isi `production`)
   *(Terkait **API MIDTRANS** dan **FONNTE OTP*, tak perlu ditaruh ke sini! Sang Komandan bisa mengisi nilainya super gampang secara *live* di Menu Sentral Admin Website Nanti!)*
6. 🏗️ **Puncak Menara Build**: Railway secara senyap mendeteksi skrip `npm run build` dan `npm start`. Anda tak perlu ngapa-ngapain selain menyiapkan secangkir kopi selagi robot (*Nixpacks*) merakit kode.
7. 🌍 **Tembakkan ke Dunia Nyata**: Pergi ke **Settings** layanan Web, temukan blok *Networking*, letuskan tembakan pamungkas dengan menekan tombol `Generate Domain`.
</details>

<br />

## 🛡️ Keamanan Kelas Berlian

Meminta dan mengamankan dana publik adalah tanggung jawab raksasa.
* **Midtrans Webhook Anti-Spoofing:** Setipis algoritma finansial sekelas VISA, setiap kilasan lunas yang masuk ke server ditolak jika tiada sandi rahasia validasi murni `SHA-512`.
* **SQL Injection Parimeter:** Kode operasi menabur kueri menggunakan `drizzle-orm sql`, menangkis peretas yang mencoba mengekstrak angka mutasi.
* **WhatsApp API Rate-Limit Armor:** Ada perlindungan selang detik antrean basis data ketika ada peretas jahat ingin mengirimi *BOT DOS* ke nomor ponsel.

<br />

<div align="center">
<b>Menembus Masa Depan Crowdfunding dengan 0% Kehilangan Data</b><br>
Hak Cipta © 2026. Dikembangkan untuk Kehebatan Tugas Akhir & Skripsi. <br>All Rights Reserved.
</div>
