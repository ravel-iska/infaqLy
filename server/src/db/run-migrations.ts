import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/infaqly';

async function runMigration() {
  console.log('⚡ Starting solid Drizzle migration runner...');
  const pool = new pg.Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  try {
    const migrationsFolder = path.resolve(__dirname, '../../drizzle');
    console.log('📄 Looking for migrations in:', migrationsFolder);
    
    await migrate(db, { migrationsFolder });
    
    console.log('✅ Migrations applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
