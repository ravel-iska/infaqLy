import { Router } from 'express';
import { db } from '../config/database.js';
import { dailyVisitors } from '../db/schema.js';
import { desc, sql } from 'drizzle-orm';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/visitors/track - Track unique visitor
router.post('/track', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    await db.insert(dailyVisitors)
      .values({ date: today, count: 1 })
      .onConflictDoUpdate({
        target: dailyVisitors.date,
        set: { count: sql`${dailyVisitors.count} + 1` }
      });

    res.json({ success: true, date: today });
  } catch (err) {
    next(err);
  }
});

// GET /api/visitors/stats - Get 7 days stats
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const rawStats = await db.select()
      .from(dailyVisitors)
      .orderBy(desc(dailyVisitors.date))
      .limit(7);

    const results = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const found = rawStats.find((s: typeof rawStats[number]) => s.date === dateStr);
      const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(d);

      results.push({
        date: dateStr,
        day: dayName.charAt(0).toUpperCase() + dayName.slice(1, 3),
        visitors: found ? found.count : 0
      });
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
