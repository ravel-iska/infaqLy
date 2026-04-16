import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/infaqly',
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const [admin] = await db.insert(schema.users).values({
    username: 'admin',
    email: 'admin@infaqly.com',
    whatsapp: '081200000000',
    passwordHash: adminPassword,
    role: 'admin',
  }).onConflictDoNothing().returning();

  if (admin) {
    console.log('✅ Admin user created: admin / admin123');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // 2. Seed basic settings
  const existingSettings = await db.select().from(schema.settings).where(eq(schema.settings.key, 'fonnte_admin_phone'));
  if (existingSettings.length === 0) {
    await db.insert(schema.settings).values({
      key: 'fonnte_admin_phone',
      value: '081200000000',
    }).onConflictDoNothing();
    console.log('✅ Default Admin Phone setting seeded');
  }

  // 3. Mock Campaigns Seed has been removed for production.

  console.log('🎉 Seed complete!');
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
