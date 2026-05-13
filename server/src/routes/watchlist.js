import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { normalizeTicker } from '../utils/ticker.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const items = getDb()
    .prepare('SELECT * FROM watchlist WHERE user_id = ? ORDER BY added_at DESC')
    .all(req.user.id);
  res.json(items);
});

router.post('/', (req, res) => {
  const { ticker, note } = req.body;
  const symbol = normalizeTicker(ticker);
  if (!symbol) return res.status(400).json({ error: 'ticker is required' });
  const db = getDb();
  try {
    const result = db.prepare(
      'INSERT INTO watchlist (user_id, ticker, note) VALUES (?, ?, ?)'
    ).run(req.user.id, symbol, note ?? null);
    res.status(201).json(db.prepare('SELECT * FROM watchlist WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Already on watchlist' });
    throw e;
  }
});

router.delete('/:ticker', (req, res) => {
  const symbol = normalizeTicker(req.params.ticker);
  const result = getDb()
    .prepare('DELETE FROM watchlist WHERE user_id = ? AND ticker = ?')
    .run(req.user.id, symbol);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: symbol });
});

export default router;
