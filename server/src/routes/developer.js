import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/stats', (req, res) => {
  const db = getDb();

  const users = db.prepare(`
    SELECT id, name, email, created_at,
      (SELECT COUNT(*) FROM holdings WHERE user_id = users.id) AS holding_count,
      (SELECT COUNT(*) FROM alerts   WHERE user_id = users.id) AS alert_count,
      (SELECT COUNT(*) FROM ai_advice WHERE user_id = users.id) AS advice_count
    FROM users
    ORDER BY created_at DESC
  `).all();

  const totals = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users)     AS total_users,
      (SELECT COUNT(*) FROM holdings)  AS total_holdings,
      (SELECT COUNT(*) FROM alerts)    AS total_alerts,
      (SELECT COUNT(*) FROM ai_advice) AS total_advice,
      (SELECT COUNT(*) FROM price_cache) AS cached_prices,
      (SELECT COUNT(*) FROM news_cache)  AS cached_news
  `).get();

  const recentActivity = db.prepare(`
    SELECT 'holding' AS type, ticker AS detail, user_id, added_at AS ts
    FROM holdings
    UNION ALL
    SELECT 'alert' AS type, ticker AS detail, user_id, created_at AS ts
    FROM alerts
    ORDER BY ts DESC
    LIMIT 20
  `).all();

  res.json({
    currentUser: req.user,
    users,
    totals,
    recentActivity,
    serverTime: Math.floor(Date.now() / 1000),
  });
});

export default router;
