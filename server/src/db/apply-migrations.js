import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/infaqly';

async function apply() {
  console.log('⚡ Starting lightweight SQL migration...');
  const pool = new pg.Pool({ connectionString: dbUrl });

  try {
    const sqlPath = path.resolve(__dirname, '../../drizzle/0000_heavy_skullbuster.sql');
    console.log('📄 Reading SQL file at:', sqlPath);
    const sqlBytes = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Executing raw SQL statements...');
    await pool.query(sqlBytes);
    
    console.log('✅ Tables created successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

apply().catch(console.error);
