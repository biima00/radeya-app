# Panduan Optimasi & Kesiapan Produksi (Laravel 11 + Filament v3)

Dokumentasi ini menjelaskan konfigurasi database MySQL/PostgreSQL produksi, strategi caching, pooling koneksi, serta panduan deployment zero-downtime untuk backend Radeya App.

---

## 1. Transisi dari SQLite ke MySQL/PostgreSQL Produksi

Pada server produksi, ubah konfigurasi database di file `.env` ke MySQL atau PostgreSQL (tidak disarankan menggunakan SQLite di produksi karena issue database locking saat trafik tinggi):

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=radeya_production
DB_USERNAME=radeya_prod_user
DB_PASSWORD=SecureProductionPassword123!
```

---

## 2. Strategi Caching untuk Performa Tinggi

Gunakan Redis atau Memcached sebagai driver cache dan session di produksi untuk waktu respons di bawah 100ms:

```env
SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
```

---

## 3. Kompilasi & Optimasi Cache Laravel

Saat melakukan deployment di production/staging, jalankan perintah optimasi berikut agar Laravel memuat konfigurasi dari cache memori tanpa membaca file disk secara terus-menerus:

```bash
# Menggabungkan seluruh file config menjadi satu file cache
php artisan config:cache

# Menggabungkan seluruh routing aplikasi
php artisan route:cache

# Pra-kompilasi semua template Blade
php artisan view:cache

# Pra-kompilasi komponen Filament
php artisan filament:cache-components
```

---

## 4. Migrasi Zero-Downtime pada Database Produksi

- **Jangan gunakan `migrate:fresh` di server produksi** karena akan menghapus seluruh data Anda.
- Jalankan migrasi biasa dengan flag `--force`:
  ```bash
  php artisan migrate --force
  ```
- **Online DDL (MySQL 8.0+)**: MySQL 8.0 mendukung penambahan kolom secara instan tanpa mengunci tabel (*Instant ALGORITHM*). Pastikan database produksi Anda menggunakan MySQL 8.0+ untuk mencegah database lock saat deploy perubahan migrasi tabel berukuran besar.
