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

## 📥 Panduan Instalasi (Development Lokal)

Proyek ini dapat dijalankan dengan lancar di Windows, macOS, maupun Linux. Pastikan Anda telah menginstal **Node.js (v20+)**, **Git**, dan **PostgreSQL**.

### 1. Kloning Repositori & Instalasi
Buka terminal (Command Prompt/PowerShell untuk Windows, Terminal untuk macOS/Linux).

```bash
git clone https://github.com/ravel-iska/infaqLy.git
cd infaqLy
```

*(Langkah ini berlaku universal untuk semua OS)*. Instalasi dependensi menggunakan skrip yang sudah disiapkan:
```bash
npm install
npm run postinstall
```

### 2. Konfigurasi Variabel Lingkungan (.env)
Buka folder `server` dan buat file konfigurasi Anda:

**Pengguna Windows (Command Prompt/PowerShell):**
```cmd
cd server
copy .env.example .env
```

**Pengguna macOS / Linux:**
```bash
cd server
cp .env.example .env
```

Buka file `.env` yang baru dibuat dengan *code editor* Anda dan isi parameter berikut:
```env
DATABASE_URL="postgres://username:password@localhost:5432/infaqly_db" # Sesuaikan dengan DB lokal Anda
JWT_SECRET="bebas_isi_text_acak_disini"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### 3. Migrasi Database (Drizzle ORM)
Pastikan PostgreSQL Anda menyala. Kembali ke direktori root (`infaqLy`), lalu jalankan:

**Pengguna Windows / macOS / Linux:**
```bash
npm --prefix server run db:push
npm --prefix server run db:seed
```

### 4. Menyalakan Server (One-Click Start)
Menyalakan *Backend*, *Frontend*, dan *Database Studio* secara bersamaan.

```bash
npm run dev
```

🌐 **Frontend URL:** `http://localhost:5173`
⚙️ **Backend URL:** `http://localhost:5000`
💾 **Drizzle Studio URL:** `https://local.drizzle.studio`

---

## ☁️ Panduan Deployment (Railway.app)

Proyek ini sangat mendukung arsitektur *serverless*, salah satu yang paling direkomendasikan adalah [Railway.app](https://railway.app). Railway mendeteksi infrastruktur kita secara otomatis menggunakan *Nixpacks*.

Ikuti langkah-langkah mudah berikut untuk *deploy* infaqLy ke Railway:

1. **Persiapkan GitHub**: Pastikan kode sistem ini sudah Anda simpan (push) ke repositori GitHub pribadi Anda.
2. **Buat Proyek di Railway**: Login ke dasbor Railway, klik `New Project` > `Deploy from GitHub repo` > Pilih repositori infaqLy Anda.
3. **Tambahkan Database PostgreSQL (Add-on)**:
   - Di tampilan kanvas Railway, tekan tombol `Create` (atau `+`), pilih `Database` > `Add PostgreSQL`.
   - Tunggu hingga *database* siap dipakai.
4. **Hubungkan Database ke Aplikasi**:
   - Klik kotak layanan *Web App* infaqLy di kanvas.
   - Buka masuk ke tab **Variables**.
   - Klik tombol **Reference Variable**, lalu hubungkan dengan *DATABASE_URL* dari PostgreSQL kotak sebelah yang baru saja Anda buat.
5. **Tambahkan Variabel Wajib Lainnya**:
   Di dalam tab **Variables** kotak *Web App* infaqLy, pastikan Anda juga menambahkan:
   - `JWT_SECRET` (Isi dengan kombinasi *password* acak yang panjang).
   - Kredensial `PORT` isi dengan `5000` (atau biarkan Railway mendeteksinya).
   - `NODE_ENV` isi dengan `production`.
   *(Catatan: Midtrans & Fonnte TIDAK PERLU dimasukkan di sini karena dapat dikonfigurasi melalui dasbor antarmuka admin UI web Anda secara dinamis!)*
6. **Deploy!**: Railway akan otomatis mendeteksi bahwa ini aplikasi *Monorepo* Vite/Node Express. Perintah *Build* dan *Start* (`npm run build` dan `npm start`) yang ada di `package.json` akan dijalankan otomatis.
7. **Atur Domain**: Masuk ke tab **Settings** di kotak Web App, gulir ke bagian **Networking**, lalu klik `Generate Domain` untuk mendapatkan *link* publik Anda!

---

## 🔐 Info Keamanan
Untuk menjaga integritas *platform*, mohon jangan pernah menyebarkan kunci akses `.env` kepada publik. Pastikan skrip `npm run clean` digunakan sebelum menggugah atau membuat paket versi stabil untuk membersihkan jejak cache.

## 📄 Lisensi
Hak Cipta © 2026. Dikembangkan untuk Skripsi & Implementasi Sistem Crowdfunding. All Rights Reserved.
