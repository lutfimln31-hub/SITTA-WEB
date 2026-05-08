# SITTA - Sistem Informasi Transaksi & Tracking Bahan Ajar (Universitas Terbuka)

## 📋 Deskripsi Proyek
SITTA adalah aplikasi web modern berbasis *Client-Side* yang dirancang untuk mengelola inventaris, transaksi, dan pelacakan pengiriman bahan ajar di Universitas Terbuka. Aplikasi ini mengusung tema **Cinematic Dark Mode** yang premium dengan fokus pada UI/UX yang intuitif dan fungsionalitas realtime.

---

## 🚀 Fitur Utama
1.  **Dashboard Interaktif**: Ringkasan operasional dengan widget statistik (Stok Total, DO Selesai, Stok Limit) dan grafik progres aktivitas pengguna.
2.  **Manajemen Stok (Realtime)**:
    *   Tampilan Grid & Tabel (View Toggle).
    *   Filter pencarian dan jenis barang (BMP/Non-BMP).
    *   Sistem tambah stok baru melalui modal.
3.  **Sistem Keranjang & Checkout (E-Commerce Style)**:
    *   *Floating Cart Button* dengan badge jumlah barang.
    *   Manajemen kuantitas di dalam keranjang.
    *   Pengurangan stok otomatis saat transaksi berhasil.
4.  **Struk Digital Otomatis**: Menghasilkan struk resmi (Official Receipt) setelah checkout yang mencakup No. Billing dan No. Resi unik.
5.  **Tracking Pengiriman (Live Simulation)**: Pelacakan status pengiriman berdasarkan Nomor DO dengan rincian timeline perjalanan paket.
6.  **Laporan & Histori**:
    *   Riwayat lengkap transaksi dengan filter status dan tanggal.
    *   Fitur **Export ke CSV** untuk pelaporan data ke Excel.

---

## 🛠️ Teknologi yang Digunakan
1.  **HTML5**: Struktur semantik untuk aplikasi web modern.
2.  **Vanilla CSS3**: 
    *   **Glassmorphism**: Efek blur pada background (Navbar & Modal).
    *   **Flexbox & Grid**: Layout responsif untuk berbagai perangkat.
    *   **CSS Variables**: Manajemen tema warna yang konsisten.
3.  **JavaScript (ES6+)**:
    *   **DOM Manipulation**: Rendering data secara dinamis tanpa refresh.
    *   **LocalStorage**: Persistensi data (Stok, Histori, Keranjang) agar data tidak hilang saat browser ditutup.
    *   **SessionStorage**: Autentikasi login sederhana.
4.  **FontAwesome 6**: Ikonografi profesional untuk elemen UI.
5.  **Google Fonts (Inter)**: Tipografi modern dan bersih.

---

## 📂 Struktur File
-   `index.html`: Halaman Login (Autentikasi).
-   `dashboard.html`: Halaman utama ringkasan data.
-   `stok.html`: Manajemen inventaris dan keranjang belanja.
-   `tracking.html`: Pelacakan pengiriman dan daftar billing.
-   `histori.html`: Laporan riwayat transaksi.
-   `css/style.css`: File styling utama (Desain Cinematic).
-   `js/data.js`: Basis data statis awal (Initial Data).
-   `js/script.js`: Logika aplikasi utama (Cart, Stock Logic, Tracking, dll).

---

## ⚙️ Cara Kerja Sistem (Logic Explanation)
1.  **Autentikasi**: Menggunakan `sessionStorage` untuk memvalidasi apakah pengguna sudah login. Jika belum, akses ke halaman internal akan dialihkan kembali ke login.
2.  **Data Persistence**: Aplikasi menggunakan `localStorage` untuk menyimpan array `stockStore` dan `historyStore`. Saat checkout dilakukan, aplikasi mengambil data dari storage, memodifikasinya (mengurangi stok & menambah histori), lalu menyimpannya kembali.
3.  **Realtime UI**: Setiap perubahan data memicu fungsi re-render (seperti `renderStockGrid()`) sehingga angka di layar berubah seketika tanpa perlu reload halaman.
4.  **Dynamic Tracking**: Jika Nomor DO ditemukan di `historyStore` (transaksi baru), sistem membuat timeline perjalanan paket secara otomatis menggunakan logika pengkondisian waktu.

---

## 📤 Instruksi Deployment ke GitHub Pages
1.  Inisialisasi repository di folder proyek: `git init`.
2.  Tambahkan semua file: `git add .`.
3.  Lakukan commit: `git commit -m "Initial release SITTA App"`.
4.  Buat repository baru di GitHub dan hubungkan: `git remote add origin [URL_REPO_ANDA]`.
5.  Push data: `git push -u origin main`.
6.  Di GitHub, buka menu **Settings > Pages**, pilih branch **main**, lalu klik **Save**.
7.  Aplikasi akan online dalam beberapa menit!

---
**Tugas Pemrograman Berbasis Web - Universitas Terbuka**
