import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import * as schema from './schema.js';

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

  // 2. Seed campaigns
  const existingCampaigns = await db.select().from(schema.campaigns);
  if (existingCampaigns.length === 0) {
    await db.insert(schema.campaigns).values([
      {
        title: 'Renovasi Masjid Al-Ikhlas',
        slug: 'renovasi-masjid-al-ikhlas',
        category: 'infaq',
        target: 100000000,
        collected: 78000000,
        donors: 342,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800&h=400&fit=crop',
        description: '<p>Masjid Al-Ikhlas membutuhkan renovasi menyeluruh setelah berdiri selama 40 tahun.</p><ul><li>Perbaikan atap dan struktur</li><li>Renovasi lantai dan dinding</li><li>Pembaharuan kelistrikan</li><li>Fasilitas wudhu baru</li></ul>',
        endDate: '2026-05-15',
      },
      {
        title: 'Santunan Anak Yatim Piatu',
        slug: 'santunan-anak-yatim-piatu',
        category: 'wakaf',
        target: 50000000,
        collected: 27500000,
        donors: 189,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=250&fit=crop',
        description: '<p>Santunan rutin untuk anak yatim piatu di Panti Asuhan Nurul Iman.</p>',
        endDate: '2026-06-01',
      },
      {
        title: 'Wakaf Quran Digital',
        slug: 'wakaf-quran-digital',
        category: 'wakaf',
        target: 50000000,
        collected: 16000000,
        donors: 95,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&h=250&fit=crop',
        description: '<p>Wakaf Quran digital untuk pesantren di daerah terpencil.</p>',
        endDate: '2026-07-15',
      },
      {
        title: 'Beasiswa Pendidikan Dhuafa',
        slug: 'beasiswa-pendidikan-dhuafa',
        category: 'infaq',
        target: 75000000,
        collected: 45000000,
        donors: 234,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop',
        description: '<p>Beasiswa untuk anak dari keluarga kurang mampu.</p>',
        endDate: '2026-06-30',
      },
      {
        title: 'Pembangunan Sumur Wakaf',
        slug: 'pembangunan-sumur-wakaf',
        category: 'wakaf',
        target: 30000000,
        collected: 22000000,
        donors: 156,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?w=400&h=250&fit=crop',
        description: '<p>Sumur bor wakaf untuk desa yang kesulitan air bersih.</p>',
        endDate: '2026-05-01',
      },
      {
        title: 'Bantuan Korban Bencana Alam',
        slug: 'bantuan-korban-bencana-alam',
        category: 'infaq',
        target: 200000000,
        collected: 120000000,
        donors: 567,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=250&fit=crop',
        description: '<p>Bantuan darurat korban bencana alam.</p>',
        endDate: '2026-04-25',
      },
    ]);
    console.log('✅ 6 campaigns seeded');
  } else {
    console.log(`ℹ️  Campaigns already exist (${existingCampaigns.length})`);
  }

  console.log('🎉 Seed complete!');
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
