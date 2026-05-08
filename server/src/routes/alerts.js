import { Router } from 'express';
import { getDb } from '../db/schema.js';

const router = Router();

router.get('/', (req, res) => {
  const alerts = getDb().prepare('SELECT * FROM alerts ORDER BY created_at DESC').all();
  res.json(alerts);
});

router.post('/', (req, res) => {
  const { ticker, type, target_price } = req.body;
  if (!ticker || !type) return res.status(400).json({ error: 'ticker and type are required' });
  if (!['above', 'below', 'sentiment_shift'].includes(type)) {
    return res.status(400).json({ error: 'type must be above, below, or sentiment_shift' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO alerts (ticker, type, target_price)
    VALUES (@ticker, @type, @target_price)
  `).run({ ticker: ticker.toUpperCase(), type, target_price: target_price ?? null });

  res.status(201).json(db.prepare('SELECT * FROM alerts WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  const result = getDb().prepare('DELETE FROM alerts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Alert not found' });
  res.json({ deleted: Number(req.params.id) });
});

export default router;
