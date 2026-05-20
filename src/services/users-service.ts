import { db } from '../db';
import { users, session } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

/**
 * Mendaftarkan pengguna baru ke dalam sistem.
 * Fungsi ini akan mengecek apakah email sudah terdaftar, melakukan hashing password,
 * dan menyimpan data pengguna baru ke database.
 * 
 * @param {RegisterUserPayload} payload - Data pengguna yang akan didaftarkan (name, email, password)
 * @returns {Promise<string>} Mengembalikan string 'Ok' jika registrasi berhasil
 * @throws {Error} Akan melempar error jika email sudah terdaftar
 */
export async function registerUser(payload: RegisterUserPayload) {
  // 1. Check if email is already registered
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, payload.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error('email sudah terdaftar');
  }

  // 2. Hash password with bcrypt using Bun native API
  const hashedPassword = await Bun.password.hash(payload.password, {
    algorithm: 'bcrypt',
    cost: 10,
  });

  // 3. Insert the new user into the database
  await db.insert(users).values({
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
  });

  return 'Ok';
}

export interface LoginUserPayload {
  email: string;
  password: string;
}

/**
 * Melakukan autentikasi pengguna dengan email dan password.
 * Fungsi ini akan memverifikasi kredensial, generate token baru,
 * dan menyimpan token ke database.
 *
 * @param {LoginUserPayload} payload - Data login (email, password)
 * @returns {Promise<object>} Mengembalikan object { token, name, email }
 * @throws {Error} Akan melempar error jika email tidak ditemukan atau password salah
 */
export async function loginUser(payload: LoginUserPayload) {
  // 1. Cari user berdasarkan email
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, payload.email))
    .limit(1);

  const user = result[0];
  if (!user) {
    throw new Error('Email atau password salah');
  }

  // 2. Verifikasi password
  const isPasswordValid = await Bun.password.verify(payload.password, user.password);
  if (!isPasswordValid) {
    throw new Error('Email atau password salah');
  }

  // 3. Generate token baru
  const token = crypto.randomUUID();

  // 4. Simpan token ke database
  await db.update(users).set({ token }).where(eq(users.id, user.id));

  return {
    token,
    name: user.name,
    email: user.email,
  };
}

/**
 * Mendapatkan data pengguna yang sedang login berdasarkan token autentikasi.
 * Fungsi ini mencari pengguna di database berdasarkan token yang diberikan.
 * 
 * @param {string} token - Token autentikasi pengguna
 * @returns {Promise<object>} Mengembalikan data pengguna (id, name, email, createdAt)
 * @throws {Error} Akan melempar error 'Unauthorized' jika token tidak ada atau pengguna tidak ditemukan
 */
export async function getCurrentUser(token: string) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  // 1. Cari user di database berdasarkan token
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.token, token))
    .limit(1);

  // 2. Jika tidak ditemukan, lempar error Unauthorized
  const user = result[0];
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Mengeluarkan pengguna dari sistem (logout) dengan menghapus sesi berdasarkan token.
 * Fungsi ini akan mencari dan menghapus data sesi yang cocok dengan token di database.
 * 
 * @param {string} token - Token autentikasi pengguna yang akan dihapus sesinya
 * @returns {Promise<string>} Mengembalikan pesan sukses jika logout berhasil
 * @throws {Error} Akan melempar error 'Unauthorized' jika token tidak valid atau sesi gagal dihapus
 */
export async function logoutUser(token: string) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const result = await db.delete(session).where(eq(session.token, token));

  if (!result[0] || result[0].affectedRows === 0) {
    throw new Error('Unauthorized');
  }

  return 'Logout successful';
}
