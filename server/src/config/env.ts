import 'dotenv/config';

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/infaqly',

  // Better Auth
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'infaqly-dev-secret',
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'https://infaqly-app.up.railway.app',

  // Midtrans
  MIDTRANS_ENV: (process.env.MIDTRANS_ENV || 'sandbox') as 'sandbox' | 'production',
  MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY || '',
  MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY || '',
  MIDTRANS_MERCHANT_ID: process.env.MIDTRANS_MERCHANT_ID || '',

  // Native WhatsApp Admin Fallback Phone
  ADMIN_PHONE: process.env.ADMIN_PHONE || process.env.FONNTE_ADMIN_PHONE || '',

  // Server
  PORT: parseInt(process.env.PORT || '5000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://infaqly-app.up.railway.app',

  // Upload
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
} as const;
