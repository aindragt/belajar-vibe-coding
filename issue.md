# Panduan Implementasi: Fitur Dapatkan User Saat Ini (Get Current User)

Dokumen ini berisi panduan langkah demi langkah untuk mengimplementasikan fitur "Get Current User" berdasarkan token otorisasi. Panduan ini dirancang agar mudah diikuti oleh Junior Programmer atau AI Model.

## 1. Pembaruan Skema Database (Drizzle ORM)
Agar kita dapat mencocokkan token yang dikirim melalui *Header*, kita perlu menambahkan kolom `token` di tabel `users`.
**File Target:** `src/db/schema.ts`

- Tambahkan field `token` ke tabel `users` dengan tipe `varchar(255)`. Field ini diperbolehkan memiliki nilai kosong (`null` atau tidak ada `notNull()`), karena setelah proses registrasi, pengguna baru biasanya belum memiliki token hingga mereka melakukan login.
- **Langkah Sinkronisasi:**
  Setelah `schema.ts` diperbarui, jalankan perintah migrasi ke database:
  ```bash
  bun run db:push
  ```

## 2. Pembuatan Service Logic (Business Logic)
Kita akan menambahkan fungsi untuk memvalidasi token dan mencari data user di database.
**File Target:** `src/services/users-service.ts`

**Tugas di dalam file ini:**
1. Buat fungsi/method asynchronous baru (misalnya `getCurrentUser(token: string)`).
2. **Pencarian Database:** Lakukan *query* ke tabel `users` menggunakan Drizzle untuk mencari satu baris di mana kolom `token` sama persis dengan argumen `token` yang diberikan.
3. **Handle Not Found:** Jika token kosong atau user tidak ditemukan berdasarkan token tersebut, fungsi harus melemparkan error (contoh: `throw new Error("Unauthorized")`) atau me-return `null`.
4. **Sanitasi Data:** Jika user ditemukan, pastikan fungsi tidak mengembalikan data yang rahasia. Jangan kembalikan `password` atau `token`. Kembalikan hanya field `id`, `name`, `email`, dan `createdAt`.

## 3. Pembaruan Routing (ElysiaJS)
Routing bertugas untuk menangkap header HTTP, mengekstrak token, dan memberikan respons sesuai spesifikasi.
**File Target:** `src/routes/users-routes.ts`

**Tugas di dalam file ini:**
1. Tambahkan endpoint baru pada instance Elysia yang ada: `GET /api/users/current`.
2. **Ekstrak Header:** Ambil nilai token dari HTTP Header `Authorization`. Pastikan Anda menangani format standar `Bearer <token>`. Hilangkan atau potong substring `"Bearer "` untuk mendapatkan token aslinya.
3. **Panggil Service:** Panggil fungsi `getCurrentUser(token)` dari `users-service.ts`.
4. **Penanganan Response:**
   - **Sukses:** Jika service mengembalikan data user, susun dan kembalikan ke dalam objek JSON dengan key `"data"`.
   - **Error (401 Unauthorized):** Jika header kosong, format salah, atau service melemparkan error "Unauthorized", tangkap error tersebut (`catch`) lalu atur status code HTTP menjadi `401`. Kembalikan objek JSON dengan key `"error"`.

---

## Spesifikasi API Reference

**Endpoint:** `GET /api/users/current`

**Headers yang Dibutuhkan:**
- `Authorization: Bearer <token>`

**Response Body (Success - HTTP 200 OK):**
```json
{
    "data": {
        "id": 1,
        "name": "Indra Pramudya",
        "email": "aindragt@gmail.com",
        "created_at": "timestamp"
    }
}
```

**Response Body (Error - HTTP 401 Unauthorized):**
*(Ditampilkan jika tidak ada header, token tidak valid, atau data user tidak ditemukan)*
```json
{
    "error": "Unauthorized"
}
```

---
**Catatan Penting untuk Implementator:**
Harap pertahankan prinsip pemisahan kode (*separation of concerns*). Modul `routes` (controller) dilarang berinteraksi dengan Drizzle ORM atau database secara langsung. Seluruh pemrosesan dan pencarian database harus diletakkan di layer `services`.
