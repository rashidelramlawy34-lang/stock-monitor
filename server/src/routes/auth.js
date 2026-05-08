import { Router } from 'express';
import { getDb } from '../db/schema.js';

const router = Router();

router.post('/login', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

  const userId = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);
  const user = { id: userId, name: name.trim() };

  const db = getDb();
  db.prepare(
    `INSERT OR IGNORE INTO users (id, name, email, avatar) VALUES (@id, @name, NULL, NULL)`
  ).run(user);

  req.session.user = user;
  // Explicitly save session before responding so cookie is set
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Session save failed' });
    res.json({ user });
  });
});

router.get('/me', (req, res) => {
  res.json({ user: req.session?.user ?? null });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

export default router;
