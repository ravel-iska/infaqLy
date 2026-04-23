import 'dotenv/config';

// Validate critical environment variables at startup
function requireEnv(key: string, label: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`\n❌ FATAL: Environment variable '${key}' (${label}) is required but not set.`);
    console.error(`   Please set it in your .env file or hosting environment variables.\n`);
    process.exit(1);
  }
  return val;
}

export const env = {
  // Database — REQUIRED (no default credentials allowed)
  DATABASE_URL: requireEnv('DATABASE_URL', 'Database Connection URL'),

  // Auth Secret — REQUIRED (no hardcoded fallback for security)
  BETTER_AUTH_SECRET: requireEnv('BETTER_AUTH_SECRET', 'Auth JWT Secret'),
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',

  // Midtrans (optional — configured via admin panel DB settings)
  MIDTRANS_ENV: (process.env.MIDTRANS_ENV || 'sandbox') as 'sandbox' | 'production',
  MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY || '',
  MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY || '',
  MIDTRANS_MERCHANT_ID: process.env.MIDTRANS_MERCHANT_ID || '',

  // Native WhatsApp Admin Fallback Phone
  ADMIN_PHONE: process.env.ADMIN_PHONE || process.env.FONNTE_ADMIN_PHONE || '',
  FONNTE_TOKEN: process.env.FONNTE_TOKEN || '',

  // Server
  PORT: parseInt(process.env.PORT || '5000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Upload
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
} as const;
