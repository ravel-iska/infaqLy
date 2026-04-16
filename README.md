<div align="center">

# 🌟 InfaqLy

**Platform Crowdfunding Syariah Modern, Transparan, & Tanpa Batas**

![InfaqLy Banner](https://raw.githubusercontent.com/ravel-iska/infaqLy/main/server/qrcode.png)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](#)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](#)

*InfaqLy adalah sebuah mahakarya platform donasi digital yang dirancang menggunakan pendekatan arsitektur terkini. Dibangun khusus dari nol untuk menjamin transparansi penyaluran dana, keamanan sekelas perbankan, dan kenyamanan donatur.*

[Sorotan Fitur](#-sorotan-fitur) • [Instalasi Lokal](#-panduan-instalasi-development-lokal) • [Railway Deployment](#%EF%B8%8F-panduan-deployment-railwayapp) • [Sistem Keamanan](#-keamanan-kelas-berlian)

---
</div>

## 🎯 Sorotan Fitur

| Kategori | Sorotan Kemampuan |
| :--- | :--- |
| 💳 **Pembayaran Pintar** | Menerima Transfer Bank (VA), e-Wallet (GoPay, OVO, ShopeePay), dan QRIS dengan integrasi webhook **Midtrans** *real-time*. |
| 📱 **Autentikasi WhatsApp** | Login & konfirmasi One-Time Password (OTP) instan tanpa repot menggunakan protokol **Fonnte API**. Melindungi dari akun lelucon (spam). |
| 📜 **Sertifikat Generatif** | Setiap donator otomatis mendapatkan *Sertifikat Penghargaan PDF* elegan sebagai kenang-kenangan amal, dicetak detik itu juga. |
| 🎨 **UI/UX Memukau** | Menghipnotis pandangan dengan estetika tajam *Glassmorphism*, transisi Mode Gelap rapi, dan sentuhan tata graha murni dari *Tailwind CSS*. |
| ⚙️ **Panel Admin Eksekutif** | Pantau analitik kampanye *live*, konfirmasi *withdrawal*, dan **Ubah Konfigurasi API Jarak Jauh** (Midtrans/WhatsApp) via web! |

---

## 📥 Panduan Instalasi (Development Lokal)

Sistem ini bersifat universal. Anda dapat merajut proyek ini di **Windows**, **macOS**, dan **Linux** asalkan memenuhi prasyarat: `Node.js v20+` dan basis data `PostgreSQL` aktif.

<details>
<summary><b>🔥 Langkah 1: Tarik Kode & Instalasi Bawaan</b></summary>
Buka bilah baris perintah (Terminal/PowerShell/Bash) Anda:

```bash
git clone https://github.com/ravel-iska/infaqLy.git
cd infaqLy
```
Pasang secara saksama seluruh instrumen *Frontend* dan *Backend* dalam sekali ayunan napas:
```bash
npm install
npm run postinstall
```
</details>

<details>
<summary><b>🔑 Langkah 2: Rahasia Variabel Lingkungan (.env)</b></summary>

Anda perlu menciptakan klona *environment variable* di dapur pacu server.

**Untuk Komandan Windows (CMD/PowerShell):**
```cmd
cd server
copy .env.example .env
```
**Untuk Ksatria macOS / Linux:**
```bash
cd server
cp .env.example .env
```
Buka berkas `.env` tersebut dengan *code editor*, lalu modifikasi jantung kehidupannya:
```env
# Hubungkan ke palung data lokal Anda (Ganti username & password yang sesuai)
DATABASE_URL="postgres://username:password@localhost:5432/infaqly_db" 
JWT_SECRET="tulis_kode_rahasia_sepanjang_mungkin_agar_anti_bocor"

# Hak kepemilikan galeri awan (Opsional tapi wajib untuk gambar)
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```
</details>

<details>
<summary><b>🧱 Langkah 3: Tempa Struktur Database (Drizzle ORM)</b></summary>

Pastikan layanan *PostgreSQL* di laptop Anda menyala bebas. Kembali ke pangkal proyek (`infaqLy`), lalu tempa kerangka tabelnya:
```bash
npm --prefix server run db:push
npm --prefix server run db:seed
```
</details>

<details>
<summary><b>🚀 Langkah 4: Nyalakan Mesin Utama (One-Click Start)</b></summary>
Kami menyematkan proyektil *Concurrent Scripts* super canggih. Anda tidak perlu repot membuka banyak terminal!

```bash
npm run dev
```

Sekejap mata, portal ini siap diakses:
* 🌐 **Situs Publik UI:** `http://localhost:5173`
* ⚙️ **Saraf API Backend:** `http://localhost:5000`
* 💾 **Radar Database (Drizzle Studio):** `https://local.drizzle.studio`
</details>

---

## ☁️ Panduan Deployment (Railway.app)

Aplikasi InfaqLy sangat mendukung arsitektur terbang tanpa awak (*Serverless*). Salah satu ekosistem paling mulus untuk melempar proyek ini ke hadapan publik adalah **[Railway.app](https://railway.app/)**, yang diotaki oleh mesin bedah *Nixpacks*.

Berikut adalah kitab panduan rilisnya:

1. 📂 **Ambulans GitHub**: Pastikan Anda sudah menyimpan (`git push`) versi bersih kode ini ke repositori Anda sendiri.
2. 🚉 **Terminal Railway**: Masuk ke dasbor Railway, lakukan `New Project` > `Deploy from GitHub repo`, dan tunjuk *infaqLy*.
3. 🗄️ **Sisipkan Otak Data**: Di kanvas *Deployment*, tekan sakelar `Create/New` > `Database` > pilih `Add PostgreSQL`. Tunggulah sampai berdenyut *online*.
4. 🔗 **Operasi Pengikatan Parameter**:
   - Ketuk kotak *Web App* (infaqLy) milik Anda.
   - Pindah ke layar **Variables**.
   - Cari tombol ajaib **Reference Variable**, lalu klik URL bawaan dari kotak *Postgres* Anda (Biasanya bernama `DATABASE_URL`).
5. 🔐 **Inyeksi Kunci Utama**: Tetap pada bilah *Variables*, isi parameter tambahan:
   - `JWT_SECRET` (Gunakan kata sandi liar pilihan Anda)
   - `PORT` dengan nilai `5000`
   - `NODE_ENV` dengan isian `production`
   - *(Catatan Emas: Detail rumit seperti lisensi Midtrans atau token Fonnte WhatsApp tidak perlu Anda taruh di sini. Semua itu **BEBAS DIATUR** kapan saja lewat panel grafis Admin rahasia Anda pada saat Web menyala!)*
6. 🏗️ **Puncak Menara Build**: Railway otomatis memahami bahwa ini adalah ekosistem monolit raksasa. Perintah bawaan `npm run build` dan `npm start` akan memandu roket meluncur sendiri.
7. 🌍 **Tembakkan ke Dunia Nyata**: Terakhir, masuk bagian **Settings**, gulung ke bawah pada ruang *Networking*, dan tekan sakral `Generate Domain`. Bagikan *Internet URL* Anda kepada kerabat terkasih.

---

## 🛡️ Keamanan Kelas Berlian (Penetrasi Anti-Hacker)

Jangan remehkan kecantikan luarnya. InfaqLy dilindungi oleh lapis pelindung berstandar industri:
* **Anti Webhook-Spoofing:** Memvalidasi aliran balik Midtrans dengan benteng verifikasi kriptografik murni `SHA-512` melawan manipulasi riwayat penyelesaian dana.
* **SQL Injection & XSS Guard:** Eksekusi gerbang data dijahit erat dengan peredam *Drizzle-ORM*.
* **WhatsApp Anti-DOS Cooldown:** Penyekat mesin *OTP Spammer*. Jeda purna waktu berlaku di antrean *database*, mematikan upaya serangan *brute force* SMS.

---

<div align="center">
<b>Dikembangkan Sepenuh Hati untuk Skripsi & Kebaikan Publik</b><br>
Hak Cipta © 2026. All Rights Reserved.
</div>
