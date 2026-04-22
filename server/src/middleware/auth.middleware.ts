import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { sessions, users } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

// Extend Express Request with user
declare global {
  namespace Express {
    interface Request {
      user?: typeof users.$inferSelect;
      sessionToken?: string;
    }
  }
}

/**
 * Extract session token from Authorization header or cookie.
 * 
 * PRIORITY ORDER (important!):
 * 1. Authorization header — the frontend explicitly sends the correct token
 *    for the current context (user token for user pages, admin token for admin pages).
 *    This MUST take priority to prevent cross-role cookie interference.
 * 2. Admin cookie ('infaqly_admin_session')
 * 3. User cookie ('infaqly_session')
 */
function extractToken(req: Request): string | null {
  // 1. Authorization header FIRST — frontend explicitly sets the right token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token.length > 0) return token;
  }

  // 2. Cookies as fallback (for httpOnly cookie-based auth)
  const adminCookie = req.cookies?.['infaqly_admin_session'];
  if (adminCookie) return adminCookie;

  const userCookie = req.cookies?.['infaqly_session'];
  if (userCookie) return userCookie;

  return null;
}

/**
 * Middleware: require authenticated user
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized — token tidak ditemukan' });
    }

    // Find valid session
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date())
      ))
      .limit(1);

    if (!session) {
      return res.status(401).json({ error: 'Session expired atau tidak valid' });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan' });
    }

    req.user = user;
    req.sessionToken = token;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Auth error' });
  }
}

/**
 * Middleware: require admin role
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden — hanya admin yang bisa mengakses' });
    }
    next();
  });
}
