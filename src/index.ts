import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { usersRoutes } from './routes/users-routes';

export const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'Belajar Vibe Coding API Documentation',
        version: '1.0.0',
        description: 'Dokumentasi API untuk project Belajar Vibe Coding'
      }
    }
  }))
  .get('/', () => ({
    status: 'ok',
    message: 'Hello Elysia from Bun + Drizzle + MySQL boilerplate!',
  }))
  .use(usersRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.listen(3000);
  console.log(
    `🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`
  );
}
