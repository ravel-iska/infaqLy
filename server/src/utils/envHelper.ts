import { db } from '../config/database.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

let cachedEnv: 'sandbox' | 'production' | null = null;
let cachedEnvAt = 0;
const ENV_CACHE_TTL = 30_000;

export async function getCurrentEnv(): Promise<'sandbox' | 'production'> {
  if (cachedEnv && Date.now() - cachedEnvAt < ENV_CACHE_TTL) return cachedEnv;

  const [gwRow] = await db.select().from(settings).where(eq(settings.key, 'active_payment_gateway')).limit(1);
  const activeGateway = gwRow?.value || 'midtrans';

  const envKey = activeGateway === 'doku' ? 'doku_env' : 'midtrans_env';
  const [envRow] = await db.select().from(settings).where(eq(settings.key, envKey)).limit(1);
  const currentEnv = envRow?.value === 'sandbox' ? 'sandbox' : 'production';

  cachedEnv = currentEnv;
  cachedEnvAt = Date.now();
  return currentEnv;
}

export function invalidateEnvCache() {
  cachedEnv = null;
}
