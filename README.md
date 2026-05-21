# Belajar Vibe Coding (API Backend)

Aplikasi ini adalah sebuah *REST API boilerplate* yang dibangun menggunakan ekosistem modern dan super cepat: **Bun**, **ElysiaJS**, dan **Drizzle ORM**. Proyek ini mendemonstrasikan implementasi autentikasi (Registrasi, Login, Current User, Logout), manajemen sesi, arsitektur berbasis *controller-service*, integrasi OpenAPI (Swagger UI), serta strategi pengujian otomatis (*unit testing*) menggunakan lingkungan basis data murni.

---

## 🛠️ Technology Stack & Library

- **Runtime & Package Manager**: [Bun](https://bun.sh/) (Cepat, *all-in-one* toolkit)
- **Web Framework**: [ElysiaJS](https://elysiajs.com/) (Framework web berkinerja tinggi yang dioptimalkan untuk Bun)
- **Object-Relational Mapping (ORM)**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database Driver**: `mysql2` (Menghubungkan aplikasi dengan database MySQL)
- **Validation**: TypeBox bawaan Elysia (`t`)
- **API Documentation**: [@elysiajs/swagger](https://github.com/elysiajs/elysia-swagger) (Integrasi OpenAPI & Swagger UI interaktif)
- **Testing**: `bun:test` (Test runner bawaan Bun yang sangat cepat)

---

## 📁 Arsitektur dan Struktur Folder

Aplikasi ini menggunakan pola arsitektur **Controller-Service** yang memisahkan logika _routing_ (penerimaan request/response HTTP) dari logika _business/database_. Standar penamaan berkas (_file naming_) menggunakan huruf kecil dan dipisahkan dengan tanda hubung (*kebab-case*), contohnya: `users-routes.ts`.

```text
.
├── .env                # Variabel lingkungan untuk koneksi database & port
├── drizzle.config.ts   # Konfigurasi Drizzle Kit untuk manajemen skema & migrasi
├── src/                # Kode sumber utama aplikasi
│   ├── db/             # Koneksi database dan definisi tabel
│   │   ├── index.ts    # Pengaturan koneksi pool MySQL
│   │   └── schema.ts   # Skema Drizzle ORM (Tabel users & session)
│   ├── routes/         # Routing Elysia (Controller layer)
│   │   └── users-routes.ts  # Endpoint API untuk entitas pengguna & integrasi OpenAPI
│   ├── services/       # Business logic (Service layer)
│   │   └── users-service.ts # Logika pendaftaran, autentikasi login, profil, dan validasi DB
│   └── index.ts        # Entry point aplikasi utama & inisialisasi Swagger
└── tests/              # Folder untuk pengujian (Unit & Integration)
    └── users.test.ts   # Skenario pengujian API pengguna menggunakan bun:test
```

---

## 📖 Dokumentasi API (Swagger UI)

Proyek ini telah dilengkapi dengan dokumentasi API interaktif menggunakan Swagger UI (OpenAPI 3.0). Semua endpoint terdaftar dengan skema request body, parameter, header otorisasi, dan contoh response yang lengkap.

- **URL Akses**: **[http://localhost:3000/swagger](http://localhost:3000/swagger)**
- **Spesifikasi JSON Mentah**: **[http://localhost:3000/swagger/json](http://localhost:3000/swagger/json)**

### Cara Menguji Endpoint Terproteksi di Swagger UI:
1. Jalankan endpoint **Login User** (`POST /api/users/login`) dengan akun terdaftar.
2. Salin nilai `token` yang dikembalikan pada response body.
3. Klik tombol **"Authorize"** (ikon gembok) di pojok kanan atas Swagger UI.
4. Masukkan token dengan format: `Bearer <token_anda>` (contoh: `Bearer 550e8400-e29b-41d4-a716-446655440000`).
5. Klik **Authorize** dan tutup modal. Sekarang Anda dapat mengakses endpoint `GET /api/users/current` dan `DELETE /api/users/logout` langsung dari Swagger UI.

---

## 🗄️ Skema Database

Database yang digunakan adalah MySQL, terdiri dari dua tabel utama:

### 1. Tabel `users`
Menyimpan informasi identitas pengguna.
- `id`: `INT` (Primary Key, Auto Increment)
- `name`: `VARCHAR(255)` (Not Null)
- `email`: `VARCHAR(255)` (Not Null, Unique)
- `password`: `VARCHAR(255)` (Not Null, menyimpan _hashed password_ menggunakan bcrypt)
- `token`: `VARCHAR(255)` (Digunakan untuk sesi aktif saat ini)
- `createdAt`: `TIMESTAMP` (Default `NOW()`)

### 2. Tabel `session`
Menyimpan data sesi ketika pengguna berhasil login/aktif, dapat menampung multi-device login (legacy session management).
- `id`: `INT` (Primary Key, Auto Increment)
- `userId`: `INT` (Not Null, Foreign Key ke `users.id`)
- `token`: `VARCHAR(255)` (Not Null, Unique, Bearer token)
- `expiresAt`: `TIMESTAMP` (Not Null, waktu kadaluarsa sesi)
- `createdAt`: `TIMESTAMP` (Default `NOW()`)

---

## 🚀 Daftar API yang Tersedia

### 1. Registrasi User Baru
- **Endpoint**: `POST /api/users`
- **Tujuan**: Mendaftarkan pengguna baru ke sistem.
- **Payload (JSON)**:
  ```json
  {
    "name": "Indra Galih",
    "email": "indra@example.com",
    "password": "secretpassword"
  }
  ```
- **Respons Sukses (200 OK)**:
  ```json
  { "data": "Ok" }
  ```
- **Respons Gagal**: 
  - `400 Bad Request`: Email sudah terdaftar (`{ "error": "email sudah terdaftar" }`)
  - `422 Unprocessable Entity`: Gagal validasi schema input payload

### 2. Login User (Autentikasi)
- **Endpoint**: `POST /api/users/login`
- **Tujuan**: Melakukan verifikasi email & password, mengembalikan token akses unik.
- **Payload (JSON)**:
  ```json
  {
    "email": "indra@example.com",
    "password": "secretpassword"
  }
  ```
- **Respons Sukses (200 OK)**:
  ```json
  {
    "data": {
      "token": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Indra Galih",
      "email": "indra@example.com"
    }
  }
  ```
- **Respons Gagal**:
  - `401 Unauthorized`: Email atau password salah (`{ "error": "Email atau password salah" }`)

### 3. Mendapatkan Data Pengguna Saat Ini (Get Current User)
- **Endpoint**: `GET /api/users/current`
- **Tujuan**: Mengambil data pengguna berdasarkan *Bearer token* yang sedang aktif.
- **Header Wajib**: 
  - `Authorization: Bearer <token_anda>`
- **Respons Sukses (200 OK)**:
  ```json
  {
    "data": {
      "id": 1,
      "name": "Indra Galih",
      "email": "indra@example.com",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  }
  ```
- **Respons Gagal**: 
  - `401 Unauthorized`: Token hilang, format salah, atau token tidak ditemukan (`{ "error": "Unauthorized" }`)

### 4. Logout User
- **Endpoint**: `DELETE /api/users/logout`
- **Tujuan**: Menghapus sesi / token pengguna yang sedang aktif dari database.
- **Header Wajib**:
  - `Authorization: Bearer <token_anda>`
- **Respons Sukses (200 OK)**:
  ```json
  { "data": "Logout successful" }
  ```
- **Respons Gagal**: 
  - `401 Unauthorized`: Sesi sudah dihapus atau tidak valid (`{ "error": "Unauthorized" }`)

---

## ⚙️ Cara Setup Project

1. **Persyaratan**: Pastikan [Bun](https://bun.sh/) dan MySQL telah terinstal di komputer Anda.
2. **Kloning dan Instalasi**:
   ```bash
   bun install
   ```
3. **Konfigurasi Lingkungan (.env)**:
   Buat file `.env` (atau gunakan yang sudah ada) dan sesuaikan kredensial MySQL.
   ```env
   PORT=3000
   DATABASE_URL=mysql://root:@localhost:3306/belajar_vibe_coding
   ```
4. **Siapkan Database**:
   Pastikan Anda sudah membuat schema/database bernama `belajar_vibe_coding` di MySQL. Kemudian, jalankan perintah migrasi Drizzle untuk membuat tabel:
   ```bash
   bun run db:generate
   ```
   Lalu terapkan skema ke database:
   ```bash
   bun run db:push
   ```

---

## 🏃‍♂️ Cara Menjalankan Aplikasi

Untuk lingkungan **Development** (dengan fitur *Hot-Reload*):
```bash
bun run dev
```

Untuk lingkungan **Production**:
```bash
bun src/index.ts
```
*Server secara default akan berjalan di `http://localhost:3000`.*

---

## 🧪 Cara Menjalankan Unit Test

Aplikasi ini dilengkapi dengan skenario *Unit Testing* yang komprehensif. Pengujian mengeksekusi langsung API dari memori dan membersihkan database setiap kali skenario berjalan (untuk menjaga konsistensi).

1. **Menjalankan Seluruh Pengujian**:
   ```bash
   bun test
   ```
2. **Memverifikasi Tipe (TypeScript Static Type-Check)**:
   ```bash
   bun x tsc --noEmit
   ```
