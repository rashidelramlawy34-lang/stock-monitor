import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  const userId = req.user.id;
  const { portfolio_id } = req.query;
  const db = getDb();
  const alerts = portfolio_id
    ? db.prepare('SELECT * FROM alerts WHERE user_id = ? AND portfolio_id = ? ORDER BY created_at DESC').all(userId, portfolio_id)
    : db.prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  res.json(alerts);
});

router.post('/', (req, res) => {
  const { ticker, type, target_price, trigger_pct, portfolio_id } = req.body;
  if (!ticker || !type) return res.status(400).json({ error: 'ticker and type are required' });
  if (!['above', 'below', 'sentiment_shift', 'pct_drop', 'pct_rise'].includes(type)) {
    return res.status(400).json({ error: 'invalid type' });
  }

  const db = getDb();
  const userId = req.user.id;
  const result = db.prepare(`
    INSERT INTO alerts (ticker, type, target_price, trigger_pct, user_id, portfolio_id)
    VALUES (@ticker, @type, @target_price, @trigger_pct, @user_id, @portfolio_id)
  `).run({ ticker: ticker.toUpperCase(), type, target_price: target_price ?? null, trigger_pct: trigger_pct ?? null, user_id: userId, portfolio_id: portfolio_id ?? null });

  res.status(201).json(db.prepare('SELECT * FROM alerts WHERE id = ?').get(result.lastInsertRowid));
});

router.post('/:id/snooze', (req, res) => {
  const hours = Number(req.body.hours ?? 24);
  const snoozedUntil = Math.floor(Date.now() / 1000) + hours * 3600;
  const result = getDb()
    .prepare('UPDATE alerts SET snoozed_until = ?, triggered = 0 WHERE id = ? AND user_id = ?')
    .run(snoozedUntil, req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Alert not found' });
  res.json(getDb().prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id));
});

router.post('/:id/reset', (req, res) => {
  const result = getDb()
    .prepare('UPDATE alerts SET triggered = 0, triggered_at = NULL, snoozed_until = NULL WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Alert not found' });
  res.json(getDb().prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id));
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
