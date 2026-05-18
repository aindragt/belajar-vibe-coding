import { mysqlTable, serial, varchar, timestamp, int } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const session = mysqlTable('session', {
  id: serial('id').primaryKey(),
  userId: int('user_id').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
