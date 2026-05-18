import { Elysia, t } from 'elysia';
import { registerUser, getCurrentUser } from '../services/users-service';

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
        set.status = 400;
        return {
          error: error.message || 'Terjadi kesalahan internal',
        };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get(
    '/api/users/current',
    async ({ headers, set }) => {
      try {
        const authHeader = headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          throw new Error('Unauthorized');
        }

        const token = authHeader.substring(7);
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
    }
  );
