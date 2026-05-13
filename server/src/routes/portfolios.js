import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { backfillDefaultPortfolioItems } from '../utils/defaultPortfolio.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const db = getDb();
  backfillDefaultPortfolioItems(db, req.user.id);
  const portfolios = db
    .prepare('SELECT * FROM portfolios WHERE user_id = ? ORDER BY created_at ASC')
    .all(req.user.id);
  res.json(portfolios);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  const db = getDb();
  const id = randomUUID();
  db.prepare('INSERT INTO portfolios (id, user_id, name) VALUES (?, ?, ?)').run(id, req.user.id, name.trim());
  res.status(201).json(db.prepare('SELECT * FROM portfolios WHERE id = ?').get(id));
});

router.patch('/:id', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  const result = getDb()
    .prepare('UPDATE portfolios SET name = ? WHERE id = ? AND user_id = ?')
    .run(name.trim(), req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json(getDb().prepare('SELECT * FROM portfolios WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const portfolio = db.prepare('SELECT * FROM portfolios WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!portfolio) return res.status(404).json({ error: 'Not found' });
  if (portfolio.is_default) return res.status(400).json({ error: 'Cannot delete default portfolio' });
  const holdingCount = db.prepare('SELECT COUNT(*) AS c FROM holdings WHERE portfolio_id = ?').get(req.params.id).c;
  if (holdingCount > 0) return res.status(400).json({ error: `Move or remove ${holdingCount} holdings first` });
  db.prepare('DELETE FROM portfolios WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ deleted: req.params.id });
});

router.post('/:id/set-default', (req, res) => {
  const db = getDb();
  const portfolio = db.prepare('SELECT * FROM portfolios WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!portfolio) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE portfolios SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  db.prepare('UPDATE portfolios SET is_default = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
