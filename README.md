# 🌟 InfaqLy: Platform Crowdfunding Syariah Modern

![InfaqLy Banner](https://raw.githubusercontent.com/ravel-iska/infaqLy/main/server/qrcode.png)

InfaqLy adalah sebuah platform donasi dan *crowdfunding* berbasis syariah yang dirancang untuk memberikan pengalaman berinfaq yang transparan, aman, dan sangat mudah. Dibangun dengan tumpukan teknologi modern untuk skalabilitas dan keamanan tinggi.

---

## 🚀 Fitur Utama

- 💳 **Pembayaran Instan (Midtrans)**: Mendukung QRIS, GoPay, OVO, transfer bank (Virtual Account), dan minimarket.
- 📱 **Autentikasi Aman via WhatsApp (Fonnte)**: Login dan Verifikasi akun (OTP) menggunakan WhatsApp, anti-bot, dan super efisien.
- 📜 **Sertifikat Amal Otomatis**: Setiap donasi sah yang masuk akan dibuatkan sertifikat PDF secara *real-time* yang dapat diunduh donatur.
- 🛡️ **Keamanan Kelas Perbankan**: Dilengkapi dengan pencegahan Injeksi SQL, pembatasan permintaan (Rate Limiting), anti-Webhook Spoofing (SHA-512 Array Protection), dan perlindungan XSS.
- 🎨 **Antarmuka Premium (UI/UX)**: Menggunakan pendekatan *Glassmorphism*, Mode Gelap otomatis, dan *responsive design* untuk pengalaman seluler terbaik.
- 🎛️ **Panel Admin yang Sangat Kuat**: Manajemen kampanye, penarikan dana, pengaturan API dinamis (Tanpa menyentuh `.env`), dan PIN-Bypass.

---

## 🛠️ Teknologi yang Digunakan

* **Frontend**: React.js (Vite), Tailwind CSS v3, DaisyUI, Recharts (Statistik).
* **Backend**: Node.js, Express.js, TypeScript.
* **Database**: PostgreSQL (via Drizzle ORM).
* **Integrasi Pihak ke-3**: Midtrans (Payment Gateway), Cloudinary (Image Hosting), Fonnte (WhatsApp Bot API).

---

## 📥 Panduan Instalasi (Development)

Pastikan NodeJS (v20+) dan PostgreSQL sudah terpasang di komputer Anda.

### 1. Kloning Repositori
```bash
git clone https://github.com/ravel-iska/infaqLy.git
cd infaqLy
```

### 2. Instalasi Dependensi Terpusat
Jalankan perintah ini di *root directory*. Ini otomatis akan menginstal dependensi untuk *frontend* maupun *backend* secara bersamaan.
```bash
npm install
npm run postinstall
```

### 3. Konfigurasi Variabel Lingkungan
Masuk ke *folder* `server` dan buat file `.env`:
```bash
cd server
cp .env.example .env
```
Isi nilai variabel `.env` dengan kredensial PostgreSQL dan API Key milik Anda:
```env
DATABASE_URL="postgres://username:password@localhost:5432/infaqly_db"
JWT_SECRET="rahasia_super_kuat_kamu"
# Credential Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### 4. Sinkronisasi Database
Kembali ke akar proyek dan lakukan *push schema*.
```bash
npm --prefix server run db:push
npm --prefix server run db:seed
```

### 5. Jalankan Server!
Proyek ini dikonfigurasi menggunakan *Concurrent Scripts*. Anda cukup menjalankan perintah ini, maka Backend, Frontend, & DB Studio akan menyala bersamaan!
```bash
npm run dev
```

🌐 **Frontend** berjalan di: `http://localhost:5173`
⚙️ **Backend** berjalan di: `http://localhost:5000`
💾 **Drizzle Studio** berjalan di: `https://local.drizzle.studio`

---

## ☁️ Panduan Deployment (Production)

Proyek ini sangat mendukung arsitektur serverless (seperti Railway, Vercel, Render) yang sudah terkonfigurasi dengan Nixpacks.

* **Perintah Build**: `npm run build`
* **Perintah Start**: `npm start`
* **Catatan Penting**: Variabel lingkungan API pihak ketiga seperti *Midtrans* dan *Fonnte* tidak di-hardcode. Semua dikonfigurasikan di halaman **Pengaturan Admin** secara langsung melalui antarmuka web, sehingga perubahan apa pun bisa *live* saat itu juga tanpa me-restart server.

---

## 🔐 Info Keamanan
Untuk menjaga integritas *platform*, mohon jangan pernah menyebarkan kunci akses `.env` kepada publik. Pastikan skrip `npm run clean` digunakan sebelum menggugah atau membuat paket versi stabil untuk membersihkan jejak cache.

## 📄 Lisensi
Hak Cipta © 2026. Dikembangkan untuk Skripsi & Implementasi Sistem Crowdfunding. All Rights Reserved.
