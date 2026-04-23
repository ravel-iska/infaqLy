import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: (() => {
      let url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/infaqly';
      try {
        const u = new URL(url);
        u.searchParams.delete('sslmode');
        return u.toString();
      } catch (e) {
        return url;
      }
    })(),
  },
});
