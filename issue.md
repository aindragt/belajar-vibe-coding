# Panduan Implementasi: Fitur Registrasi User

Dokumen ini berisi panduan langkah demi langkah untuk mengimplementasikan fitur registrasi user menggunakan **ElysiaJS**, **Bun**, dan **Drizzle ORM** (MySQL). Panduan ini dirancang agar mudah diikuti oleh Junior Programmer atau AI Model.

## 1. Pembaruan Skema Database (Drizzle ORM)
Kita perlu memperbarui skema tabel `users` agar sesuai dengan kebutuhan sistem autentikasi.
**File Target:** `src/db/schema.ts`

- Modifikasi tabel `users` yang sudah ada agar memiliki field berikut:
  - `id`: tipe integer, primary key, auto increment (`serial` pada Drizzle).
  - `name`: tipe varchar (length 255), not null.
  - `email`: tipe varchar (length 255), not null, harus unik.
  - `password`: tipe varchar (length 255), not null (kolom ini akan menyimpan hash bcrypt, bukan plain text).
  - `created_at`: tipe timestamp, not null, dengan nilai default `current_timestamp`.

**Langkah Sinkronisasi:**
Setelah `schema.ts` diubah, jangan lupa untuk menjalankan migrasi ke database (misal menggunakan `bun run db:push`).

## 2. Pembuatan Service Logic (Business Logic)
Kita akan memisahkan *business logic* dari *routing* agar kode lebih terstruktur.
**Struktur Folder:** Buat folder baru `src/services`
**File Target:** `src/services/users-service.ts`

**Tugas di dalam file ini:**
1. Buat fungsi/method asynchronous untuk registrasi (misalnya `registerUser(payload)`).
2. **Validasi Email:** Lakukan pencarian ke tabel `users` menggunakan Drizzle untuk mengecek apakah `email` dari payload sudah ada.
3. **Handle Error Duplikasi:** Jika email ditemukan, fungsi harus melemparkan error atau mereturn indikator kegagalan spesifik ("email sudah terdaftar").
4. **Hashing Password:** Hash password dari payload menggunakan algoritma `bcrypt`. 
   *(Saran: Karena kita menggunakan Bun, Anda bisa langsung menggunakan API bawaan `Bun.password.hash(password, "bcrypt")` tanpa perlu menginstall package pihak ketiga).*
5. **Insert Data:** Simpan data (`name`, `email`, `password` yang sudah di-hash) ke dalam database menggunakan Drizzle.

## 3. Pembuatan Routing (ElysiaJS)
Routing bertugas untuk menangani HTTP request dan memberikan response yang sesuai.
**Struktur Folder:** Buat folder baru `src/routes`
**File Target:** `src/routes/users-routes.ts`

**Tugas di dalam file ini:**
1. Inisialisasi instance plugin route dari Elysia.
2. Buat endpoint `POST /api/users`.
3. Tambahkan validasi tipe untuk Request Body menggunakan skema bawaan Elysia (`t.Object`), pastikan `name`, `email`, dan `password` bertipe string dan wajib diisi.
4. Di dalam handler, panggil fungsi dari `users-service.ts`.
5. Tangkap hasil/error dari service, lalu kembalikan HTTP response sesuai spesifikasi.

## 4. Integrasi Routing ke Entry Point
Integrasikan module routing yang baru dibuat ke server utama.
**File Target:** `src/index.ts`

- Import module route dari `src/routes/users-routes.ts`.
- Daftarkan (use) route tersebut ke instance utama `Elysia`.
- Hapus endpoint dummy `/users` yang mungkin sebelumnya ada di `index.ts` agar tidak bentrok.

---

## Spesifikasi API Reference

**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
    "name": "Indra Pramudya",
    "email": "aindragt@gmail.com",
    "password": "rahasia"    
}
```

**Response Body (Success - 200/201):**
```json
{
    "data": "Ok"
}
```

**Response Body (Error - 400 Bad Request):**
*(Ditampilkan jika email sudah pernah diregistrasikan)*
```json
{
    "error": "email sudah terdaftar"
}
```

---
**Catatan Penting untuk Implementator:**
Harap patuhi struktur arsitektur ini. *Controllers / Route handlers* tidak boleh mengeksekusi sintaks Drizzle secara langsung; seluruh komunikasi ke database harus melalui layer `services`.
