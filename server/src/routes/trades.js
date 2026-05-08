import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { portfolio_id } = req.query;
  const db = getDb();
  const trades = portfolio_id
    ? db.prepare('SELECT * FROM trades WHERE user_id = ? AND portfolio_id = ? ORDER BY traded_at DESC').all(req.user.id, portfolio_id)
    : db.prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY traded_at DESC').all(req.user.id);
  res.json(trades);
});

router.post('/', (req, res) => {
  const { ticker, action, shares, price, fees, traded_at, note, portfolio_id } = req.body;
  if (!ticker || !action || !shares || !price) {
    return res.status(400).json({ error: 'ticker, action, shares, price required' });
  }
  if (!['buy', 'sell'].includes(action)) {
    return res.status(400).json({ error: 'action must be buy or sell' });
  }
  const db = getDb();
  const ts = traded_at ? Math.floor(new Date(traded_at).getTime() / 1000) : Math.floor(Date.now() / 1000);
  const result = db.prepare(`
    INSERT INTO trades (user_id, ticker, action, shares, price, fees, traded_at, note, portfolio_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, ticker.toUpperCase(), action, Number(shares), Number(price), Number(fees ?? 0), ts, note ?? null, portfolio_id ?? null);
  res.status(201).json(db.prepare('SELECT * FROM trades WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  const result = getDb()
    .prepare('DELETE FROM trades WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: Number(req.params.id) });
});

router.get('/summary', (req, res) => {
  const trades = getDb()
    .prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY traded_at ASC')
    .all(req.user.id);

  const byTicker = {};
  for (const t of trades) {
    if (!byTicker[t.ticker]) byTicker[t.ticker] = { buys: [], sells: [] };
    if (t.action === 'buy') byTicker[t.ticker].buys.push({ shares: t.shares, price: t.price, fees: t.fees });
    else byTicker[t.ticker].sells.push({ shares: t.shares, price: t.price, fees: t.fees });
  }

  const summary = [];
  for (const [ticker, { buys, sells }] of Object.entries(byTicker)) {
    const queue = buys.map(b => ({ ...b })); // FIFO queue copy
    let realized = 0;
    let totalBought = buys.reduce((s, b) => s + b.shares * b.price + b.fees, 0);
    let totalSold = 0;

    for (const sell of sells) {
      let remaining = sell.shares;
      totalSold += sell.shares * sell.price - sell.fees;
      while (remaining > 0 && queue.length > 0) {
        const lot = queue[0];
        const used = Math.min(lot.shares, remaining);
        realized += (sell.price - lot.price) * used - (sell.fees * used / sell.shares);
        lot.shares -= used;
        remaining -= used;
        if (lot.shares <= 0) queue.shift();
      }
    }

    summary.push({ ticker, realized_pgl: realized, total_bought: totalBought, total_sold: totalSold });
  }

  res.json(summary);
});

export default router;
