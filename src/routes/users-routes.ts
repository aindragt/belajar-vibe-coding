import { Elysia, t } from 'elysia';
import { registerUser } from '../services/users-service';

export const usersRoutes = new Elysia().post(
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
);
