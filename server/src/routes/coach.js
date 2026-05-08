import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { getPortfolioCoach } from '../services/aiService.js';

const router = Router();
router.use(requireAuth);

const CACHE_TTL = 24 * 60 * 60; // 24 hours

router.get('/', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM coach_cache WHERE user_id = ?').get(req.user.id);
  if (!row || Math.floor(Date.now() / 1000) - row.generated_at > CACHE_TTL) {
    return res.json(null);
  }
  try {
    res.json({ ...JSON.parse(row.analysis), generated_at: row.generated_at });
  } catch {
    res.json(null);
  }
});

router.post('/refresh', async (req, res) => {
  const db = getDb();
  const userId = req.user.id;

  const holdings = db.prepare(
    "SELECT * FROM holdings WHERE user_id = ?"
  ).all(userId);

  if (holdings.length === 0) {
    return res.status(400).json({ error: 'No holdings to analyze' });
  }

  // Build advice map from latest cached advice per ticker
  const allAdvice = {};
  for (const h of holdings) {
    const row = db.prepare(
      'SELECT * FROM ai_advice WHERE ticker = ? AND user_id = ? ORDER BY generated_at DESC LIMIT 1'
    ).get(h.ticker, userId);
    if (row) allAdvice[h.ticker] = row;
  }

  // Build fundamentals map
  const allFundamentals = {};
  for (const h of holdings) {
    const row = db.prepare('SELECT * FROM fundamentals_cache WHERE ticker = ?').get(h.ticker);
    if (row) allFundamentals[h.ticker] = row;
  }

  // Build prices map
  const allPrices = {};
  for (const h of holdings) {
    const row = db.prepare('SELECT * FROM price_cache WHERE ticker = ?').get(h.ticker);
    if (row) allPrices[h.ticker] = row;
  }

  try {
    const analysis = await getPortfolioCoach(holdings, allAdvice, allFundamentals, allPrices);
    const analysisJson = JSON.stringify(analysis);
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      INSERT INTO coach_cache (user_id, analysis, generated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET analysis = excluded.analysis, generated_at = excluded.generated_at
    `).run(userId, analysisJson, now);

    res.json({ ...analysis, generated_at: now });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
