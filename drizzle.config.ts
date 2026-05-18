import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "belajar_vibe_coding",
    // port: Number(process.env.DB_PORT) || 3306,
    // url: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/belajar_vibe_coding',
  },
});
