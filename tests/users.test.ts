import { describe, expect, it, beforeEach, afterAll } from 'bun:test';
import { app } from '../src/index';
import { db, poolConnection } from '../src/db';
import { users, session } from '../src/db/schema';
import { eq } from 'drizzle-orm';

describe('User API Unit Tests', () => {
  beforeEach(async () => {
    // Clear session first due to foreign keys if any (users to sessions)
    await db.delete(session);
    await db.delete(users);
  });

  afterAll(async () => {
    // Close the connection pool cleanly so the test runner can exit
    await poolConnection.end();
  });

  describe('POST /api/users - User Registration', () => {
    it('should successfully register a new user with valid data', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Indra Test',
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data).toBe('Ok');

      // Verify user is in database
      const dbUsers = await db.select().from(users).where(eq(users.email, 'test@example.com')).limit(1);
      expect(dbUsers.length).toBe(1);
      expect(dbUsers[0]!.name).toBe('Indra Test');
    });

    it('should fail if email is already registered', async () => {
      const hashedPassword = await Bun.password.hash('password123', {
        algorithm: 'bcrypt',
        cost: 4,
      });

      await db.insert(users).values({
        name: 'Existing User',
        email: 'test@example.com',
        password: hashedPassword,
      });

      const res = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'New User',
            email: 'test@example.com',
            password: 'password999',
          }),
        })
      );

      expect(res.status).toBe(400);
      const body = await res.json() as any;
      expect(body.error).toBe('email sudah terdaftar');
    });

    it('should fail if name length exceeds 255 characters', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'a'.repeat(256),
            email: 'validation@example.com',
            password: 'password123',
          }),
        })
      );

      expect(res.status).toBe(422);
    });

    it('should fail if email format is invalid', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Valid Name',
            email: 'invalid-email-format',
            password: 'password123',
          }),
        })
      );

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/users/current - Get Current User', () => {
    it('should successfully return current user data with valid Bearer token', async () => {
      const hashedPassword = await Bun.password.hash('password123', {
        algorithm: 'bcrypt',
        cost: 4,
      });

      await db.insert(users).values({
        name: 'Test Current User',
        email: 'current@example.com',
        password: hashedPassword,
        token: 'valid-test-token-123',
      });

      const res = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer valid-test-token-123',
          },
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.name).toBe('Test Current User');
      expect(body.data.email).toBe('current@example.com');
    });

    it('should fail if Authorization header is missing', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
        })
      );

      expect(res.status).toBe(401);
      const body = await res.json() as any;
      expect(body.error).toBe('Unauthorized');
    });

    it('should fail if Authorization header is not in Bearer format', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
          headers: {
            'Authorization': 'Basic token-format',
          },
        })
      );

      expect(res.status).toBe(401);
      const body = await res.json() as any;
      expect(body.error).toBe('Unauthorized');
    });

    it('should fail if token does not exist in the database', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer non-existent-token',
          },
        })
      );

      expect(res.status).toBe(401);
      const body = await res.json() as any;
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/users/logout - User Logout', () => {
    it('should successfully logout and clear session in database', async () => {
      const insertUser = await db.insert(users).values({
        name: 'Logout User',
        email: 'logout@example.com',
        password: 'password123',
      });
      const userId = insertUser[0].insertId;

      await db.insert(session).values({
        userId,
        token: 'logout-test-token-123',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });

      const res = await app.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer logout-test-token-123',
          },
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data).toBe('Logout successful');

      // Verify the session is removed
      const dbSessions = await db.select().from(session).where(eq(session.token, 'logout-test-token-123')).limit(1);
      expect(dbSessions.length).toBe(0);
    });

    it('should fail if token is not found in session table', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer non-existent-session-token',
          },
        })
      );

      expect(res.status).toBe(401);
      const body = await res.json() as any;
      expect(body.error).toBe('Unauthorized');
    });

    it('should fail if Authorization header is missing', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE',
        })
      );

      expect(res.status).toBe(401);
      const body = await res.json() as any;
      expect(body.error).toBe('Unauthorized');
    });
  });
});
