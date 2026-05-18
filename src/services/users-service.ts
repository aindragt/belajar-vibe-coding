import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

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
