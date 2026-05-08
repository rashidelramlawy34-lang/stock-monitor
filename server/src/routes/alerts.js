import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  const userId = req.user.id;
  const alerts = getDb()
    .prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId);
  res.json(alerts);
});

router.post('/', (req, res) => {
  const { ticker, type, target_price } = req.body;
  if (!ticker || !type) return res.status(400).json({ error: 'ticker and type are required' });
  if (!['above', 'below', 'sentiment_shift'].includes(type)) {
    return res.status(400).json({ error: 'type must be above, below, or sentiment_shift' });
  }

  const db = getDb();
  const userId = req.user.id;
  const result = db.prepare(`
    INSERT INTO alerts (ticker, type, target_price, user_id)
    VALUES (@ticker, @type, @target_price, @user_id)
  `).run({ ticker: ticker.toUpperCase(), type, target_price: target_price ?? null, user_id: userId });

  res.status(201).json(db.prepare('SELECT * FROM alerts WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  const result = getDb()
    .prepare('DELETE FROM alerts WHERE id = ? AND user_id = ?')
    .run(req.params.id, userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Alert not found' });
  res.json({ deleted: Number(req.params.id) });
});

export default router;
