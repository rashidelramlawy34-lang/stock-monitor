import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  const userId = req.user.id;
  const holdings = getDb()
    .prepare('SELECT * FROM holdings WHERE user_id = ? ORDER BY added_at DESC')
    .all(userId);
  res.json(holdings);
});

// Returns hourly portfolio value snapshots from price_history (scoped to user's holdings)
router.get('/history', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const holdings = db
    .prepare('SELECT ticker, shares FROM holdings WHERE user_id = ?')
    .all(userId);
  if (holdings.length === 0) return res.json([]);

  const tickers = holdings.map(h => h.ticker);
  const sharesMap = Object.fromEntries(holdings.map(h => [h.ticker, h.shares]));

  const since = Math.floor(Date.now() / 1000) - 7 * 86400;
  const placeholders = tickers.map(() => '?').join(',');

  // Get price history for all tickers
  const rows = db.prepare(
    `SELECT ticker, price, recorded_at FROM price_history
     WHERE ticker IN (${placeholders}) AND recorded_at > ?
     ORDER BY recorded_at ASC`
  ).all(...tickers, since);

  // Group into hourly buckets and compute portfolio value at each point
  const buckets = new Map();
  for (const row of rows) {
    const bucket = Math.floor(row.recorded_at / 3600) * 3600;
    if (!buckets.has(bucket)) buckets.set(bucket, {});
    buckets.get(bucket)[row.ticker] = row.price;
  }

  // For each bucket, fill forward any missing tickers from previous bucket
  let prevPrices = {};
  const points = [];
  for (const [ts, prices] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
    const merged = { ...prevPrices, ...prices };
    prevPrices = merged;
    const value = tickers.reduce((sum, t) => {
      return sum + (merged[t] ?? 0) * (sharesMap[t] ?? 0);
    }, 0);
    if (value > 0) points.push({ ts, value: Math.round(value * 100) / 100 });
  }

  res.json(points);
});

router.post('/', (req, res) => {
  const { ticker, shares, cost_basis, name } = req.body;
  if (!ticker || typeof shares !== 'number' || typeof cost_basis !== 'number') {
    return res.status(400).json({ error: 'ticker, shares (number), and cost_basis (number) are required' });
  }

  const db = getDb();
  const userId = req.user.id;
  const upperTicker = ticker.toUpperCase();

  db.prepare(`
    INSERT OR REPLACE INTO holdings (ticker, name, shares, cost_basis, user_id)
    VALUES (@ticker, @name, @shares, @cost_basis, @user_id)
  `).run({ ticker: upperTicker, name: name ?? null, shares, cost_basis, user_id: userId });

  res.status(201).json(
    db.prepare('SELECT * FROM holdings WHERE ticker = ? AND user_id = ?').get(upperTicker, userId)
  );
});

router.patch('/:ticker', (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const { shares, cost_basis, name } = req.body;
  const userId = req.user.id;

  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM holdings WHERE ticker = ? AND user_id = ?')
    .get(ticker, userId);
  if (!existing) return res.status(404).json({ error: 'Holding not found' });

  db.prepare(`
    UPDATE holdings SET
      shares     = COALESCE(@shares, shares),
      cost_basis = COALESCE(@cost_basis, cost_basis),
      name       = COALESCE(@name, name)
    WHERE ticker = @ticker AND user_id = @user_id
  `).run({ ticker, shares: shares ?? null, cost_basis: cost_basis ?? null, name: name ?? null, user_id: userId });

  res.json(
    db.prepare('SELECT * FROM holdings WHERE ticker = ? AND user_id = ?').get(ticker, userId)
  );
});

router.delete('/:ticker', (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const userId = req.user.id;
  const result = getDb()
    .prepare('DELETE FROM holdings WHERE ticker = ? AND user_id = ?')
    .run(ticker, userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Holding not found' });
  res.json({ deleted: ticker });
});

export default router;
