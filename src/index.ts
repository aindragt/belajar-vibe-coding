import { Elysia } from 'elysia';
import { usersRoutes } from './routes/users-routes';

const app = new Elysia()
  .get('/', () => ({
    status: 'ok',
    message: 'Hello Elysia from Bun + Drizzle + MySQL boilerplate!',
  }))
  .use(usersRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`
);
