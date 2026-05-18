import { Elysia, t } from 'elysia';
import { db } from './db';
import { users } from './db/schema';

const app = new Elysia()
  .get('/', () => ({
    status: 'ok',
    message: 'Hello Elysia from Bun + Drizzle + MySQL boilerplate!',
  }))
  .get('/users', async () => {
    try {
      const allUsers = await db.select().from(users);
      return {
        success: true,
        data: allUsers,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch users',
      };
    }
  })
  .post(
    '/users',
    async ({ body }) => {
      try {
        const result = await db.insert(users).values({
          name: body.name,
          email: body.email,
        });
        return {
          success: true,
          message: 'User created successfully',
          insertId: result[0].insertId,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to create user',
        };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    }
  )
  .listen(3000);

console.log(
  `🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`
);
