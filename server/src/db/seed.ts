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

  // 3. Seed test donations for certificate download testing
  const existingDonations = await db.select().from(schema.donations);
  if (existingDonations.length === 0) {
    // Find the admin user and any active campaign
    const [adminUser] = await db.select().from(schema.users).where(eq(schema.users.role, 'admin'));
    const [activeCampaign] = await db.select().from(schema.campaigns);

    if (adminUser && activeCampaign) {
      await db.insert(schema.donations).values([
        {
          orderId: 'INF-TEST-001',
          userId: adminUser.id,
          campaignId: activeCampaign.id,
          donorName: activeCampaign.title,
          donorEmail: adminUser.email,
          donorPhone: adminUser.whatsapp,
          amount: 250000,
          paymentMethod: 'bank_transfer',
          paymentStatus: 'success',
          paidAt: new Date(),
        },
        {
          orderId: 'INF-TEST-002',
          userId: adminUser.id,
          campaignId: activeCampaign.id,
          donorName: activeCampaign.title,
          donorEmail: adminUser.email,
          donorPhone: adminUser.whatsapp,
          amount: 100000,
          paymentMethod: 'ewallet',
          paymentStatus: 'success',
          paidAt: new Date(Date.now() - 86400000), // yesterday
        },
        {
          orderId: 'INF-TEST-003',
          userId: adminUser.id,
          campaignId: activeCampaign.id,
          donorName: activeCampaign.title,
          donorEmail: adminUser.email,
          donorPhone: adminUser.whatsapp,
          amount: 50000,
          paymentMethod: 'qris',
          paymentStatus: 'pending',
        },
      ]).onConflictDoNothing();
      console.log('✅ Test donations seeded (2 success, 1 pending)');
    } else {
      console.log('⚠️  Skipped donation seeding — no admin user or campaign found');
    }
  } else {
    console.log('ℹ️  Donations already exist, skipping seed');
  }

  console.log('🎉 Seed complete!');
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
