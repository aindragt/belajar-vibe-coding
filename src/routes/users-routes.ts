import { Elysia, t } from 'elysia';
import { registerUser, loginUser, getCurrentUser, logoutUser } from '../services/users-service';

function extractBearerToken(headers: Record<string, string | undefined>): string {
  const authHeader = headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  return authHeader.substring(7);
}

export const usersRoutes = new Elysia()
  .post(
    '/api/users',
    async ({ body, set }) => {
      try {
        const result = await registerUser(body);
        return {
          data: result,
        };
      } catch (error: any) {
        const message = error.message || '';
        if (message === 'email sudah terdaftar') {
          set.status = 400;
          return {
            error: message,
          };
        }

        set.status = 500;
        return {
          error: 'Terjadi kesalahan internal pada server',
        };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        email: t.String({ format: 'email', maxLength: 255 }),
        password: t.String({ minLength: 6, maxLength: 255 }),
      }),
      response: {
        200: t.Object({
          data: t.String({ examples: ['Ok'] }),
        }),
        400: t.Object({
          error: t.String({ examples: ['email sudah terdaftar'] }),
        }),
        500: t.Object({
          error: t.String({ examples: ['Terjadi kesalahan internal pada server'] }),
        }),
      },
      detail: {
        tags: ['Users'],
        summary: 'Register User',
        description: 'Mendaftarkan pengguna baru dengan nama, email, dan password.',
      }
    }
  )
  .post(
    '/api/users/login',
    async ({ body, set }) => {
      try {
        const result = await loginUser(body);
        return {
          data: result,
        };
      } catch (error: any) {
        set.status = 401;
        return {
          error: 'Email atau password salah',
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 1 }),
      }),
      response: {
        200: t.Object({
          data: t.Object({
            token: t.String({ examples: ['550e8400-e29b-41d4-a716-446655440000'] }),
            name: t.String({ examples: ['Indra Galih'] }),
            email: t.String({ examples: ['indra@example.com'] }),
          }),
        }),
        401: t.Object({
          error: t.String({ examples: ['Email atau password salah'] }),
        }),
      },
      detail: {
        tags: ['Users'],
        summary: 'Login User',
        description: 'Melakukan autentikasi pengguna dengan email dan password, mengembalikan token.',
      }
    }
  )
  .get(
    '/api/users/current',
    async ({ headers, set }) => {
      try {
        const token = extractBearerToken(headers);
        const user = await getCurrentUser(token);

        return {
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.createdAt,
          },
        };
      } catch (error: any) {
        set.status = 401;
        return {
          error: 'Unauthorized',
        };
      }
    },
    {
      headers: t.Object({
        authorization: t.String({ description: 'Format: Bearer <token>' })
      }),
      response: {
        200: t.Object({
          data: t.Object({
            id: t.Number({ examples: [1] }),
            name: t.String({ examples: ['Indra Galih'] }),
            email: t.String({ examples: ['indra@example.com'] }),
            created_at: t.Date({ examples: ['2026-01-01T00:00:00.000Z'] }),
          }),
        }),
        401: t.Object({
          error: t.String({ examples: ['Unauthorized'] }),
        }),
      },
      detail: {
        tags: ['Users'],
        summary: 'Get Current User',
        description: 'Mengambil data profil pengguna yang sedang aktif berdasarkan token otorisasi.',
      }
    }
  )
  .delete(
    '/api/users/logout',
    async ({ headers, set }) => {
      try {
        const token = extractBearerToken(headers);
        const result = await logoutUser(token);

        return {
          data: result,
        };
      } catch (error: any) {
        set.status = 401;
        return {
          error: 'Unauthorized',
        };
      }
    },
    {
      headers: t.Object({
        authorization: t.String({ description: 'Format: Bearer <token>' })
      }),
      response: {
        200: t.Object({
          data: t.String({ examples: ['Logout successful'] }),
        }),
        401: t.Object({
          error: t.String({ examples: ['Unauthorized'] }),
        }),
      },
      detail: {
        tags: ['Users'],
        summary: 'Logout User',
        description: 'Menghapus sesi pengguna yang aktif dari database.',
      }
    }
  );
