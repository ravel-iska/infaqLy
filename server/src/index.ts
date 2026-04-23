import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './config/database.js';
import { sql } from 'drizzle-orm';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { expirePendingDonations } from './services/donation.service.js';
import rateLimit from 'express-rate-limit';

// ═══ Rate Limiters ═══
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 req/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit tercapai. Tunggu sebentar.' },
});

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import campaignRoutes from './routes/campaign.routes.js';
import donationRoutes from './routes/donation.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import withdrawalRoutes from './routes/withdrawal.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import wabotRoutes from './routes/wabot.routes.js';
import bugsRoutes from './routes/bugs.routes.js';
import visitorRoutes from './routes/visitor.routes.js';
import { startBot } from './services/wabot.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Trust proxy for rate limiting (since we're behind Vercel/Railway reverse proxies)
app.set('trust proxy', 1);

// ═══ Global Middleware ═══
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Let frontend handle its own CSP or allow external images
}));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// ═══ API Routes ═══
app.use('/api', apiLimiter); // General rate limit for all API
app.use('/api/auth', authLimiter, authRoutes); // Stricter limit for auth
app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/bugs', bugsRoutes);
app.use('/api/midtrans', paymentRoutes);
app.use('/api/wabot', wabotRoutes);
app.use('/api/visitors', visitorRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ═══ Serve Frontend (Production) ═══
// In production, serve the Vite-built frontend
const frontendDist = path.resolve(__dirname, '../../dist');
if (fs.existsSync(frontendDist)) {
  // Cache hashed assets aggressively (CSS/JS/images) — 1 year
  app.use(express.static(frontendDist, {
    maxAge: '365d',
    immutable: true,
    setHeaders: (res, filePath) => {
      // HTML files should not be cached long (SPA needs fresh index.html)
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));
  // SPA fallback — all non-API routes serve index.html
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log(`   📦 Serving frontend from ${frontendDist}`);
}

// ═══ Error Handler ═══
app.use(errorHandler);

// ═══ Start Server ═══
app.listen(env.PORT, async () => {
  console.log(`\n🕌 infaqLy API Server`);
  
  try {
    // Ensure table structure is updated for isolated withdrawals (safe migrations)
    await db.execute(sql`ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS env VARCHAR(20) NOT NULL DEFAULT 'production'`);
    console.log('[DB] Verified withdrawals schema');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.warn('[DB] Failed to verify withdrawals schema:', err.message);
    }
  }

  console.log(`   Port:     ${env.PORT}`);
  console.log(`   Frontend: ${env.FRONTEND_URL}`);
  console.log(`   Midtrans: ${env.MIDTRANS_ENV}`);

  console.log(`   DB:       ${env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);
  console.log(`\n   Ready! 🚀\n`);

  // ═══ Cron: Auto-expire pending donations older than 23 hours ═══
  const EXPIRE_INTERVAL_MS = 15 * 60 * 1000; // Every 15 minutes

  async function runExpiry() {
    try {
      const count = await expirePendingDonations();
      if (count > 0) {
        console.log(`[Cron] ⏰ ${count} donasi pending kedaluwarsa (>23 jam)`);
      }
    } catch (err) {
      console.error('[Cron] Error expiring donations:', err);
    }
  }

  // Run immediately on startup, then every 15 minutes
  runExpiry();
  setInterval(runExpiry, EXPIRE_INTERVAL_MS);
  console.log('   ⏰ Cron: Auto-expire donations setiap 15 menit');

  // ═══ WhatsApp Bot: Auto-start ═══
  startBot().catch((err) => console.error('[WABot] Auto-start error:', err));
  console.log('   📱 WABot: Baileys self-hosted (untuk OTP)\n');
});

// ═══ Graceful Shutdown (Railway & PM2) ═══
const gracefulShutdown = (signal: string) => {
  console.log(`\n[SYSTEM] Received ${signal}, shutting down gracefully...`);
  // Cleanup logic here (like closing DB conns) if necessary
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('[SYSTEM] Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[SYSTEM] Unhandled Rejection:', reason);
});

export default app;
