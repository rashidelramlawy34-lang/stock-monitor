import { Router } from 'express';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { getDb } from '../db/schema.js';

const router = Router();

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  try {
    const [salt, hash] = stored.split(':');
    const hashBuf = Buffer.from(hash, 'hex');
    const supplied = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuf, supplied);
  } catch {
    return false;
  }
}

// POST /auth/signup
router.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim()) return res.status(400).json({ error: 'Username is required' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const userId = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40);
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (existing) return res.status(409).json({ error: 'Username already taken' });

  const passwordHash = hashPassword(password);
  const user = { id: userId, name: username.trim(), email: null, avatar: null, password_hash: passwordHash };

  db.prepare(
    `INSERT INTO users (id, name, email, avatar, password_hash) VALUES (@id, @name, @email, @avatar, @password_hash)`
  ).run(user);

  const safeUser = { id: userId, name: username.trim() };
  req.session.user = safeUser;
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });
    res.json({ user: safeUser });
  });
});

// POST /auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim()) return res.status(400).json({ error: 'Username is required' });
  if (!password) return res.status(400).json({ error: 'Password is required' });

  const userId = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40);
  const db = getDb();

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!row) return res.status(401).json({ error: 'Invalid username or password' });

  // Legacy accounts (no password set) — migrate on first login
  if (!row.password_hash) {
    const passwordHash = hashPassword(password);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);
  } else if (!verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const safeUser = { id: row.id, name: row.name };
  req.session.user = safeUser;
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });
    res.json({ user: safeUser });
  });
});

// GET /auth/me
router.get('/me', (req, res) => {
  res.json({ user: req.session?.user ?? null });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

export default router;
