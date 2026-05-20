import { Elysia, t } from 'elysia';
import { registerUser, getCurrentUser, logoutUser } from '../services/users-service';

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
      detail: {
        tags: ['Users'],
        summary: 'Registrasi User Baru',
        description: 'Mendaftarkan pengguna baru dengan nama, email, dan password.',
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
      detail: {
        tags: ['Users'],
        summary: 'Dapatkan User Saat Ini',
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
      detail: {
        tags: ['Users'],
        summary: 'Logout User',
        description: 'Menghapus sesi pengguna yang aktif dari database.',
      }
    }
  );

