import { Router } from 'express';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { getDb } from '../db/schema.js';
import { ensureDemoAccount } from '../db/demoData.js';
import { backfillDefaultPortfolioItems, ensureDefaultPortfolio } from '../utils/defaultPortfolio.js';

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
  ensureDefaultPortfolio(db, userId);

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
  backfillDefaultPortfolioItems(db, userId);

  const safeUser = { id: row.id, name: row.name };
  req.session.user = safeUser;
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });
    res.json({ user: safeUser });
  });
});

// POST /auth/demo — create/refresh a rich demo account and sign in.
router.post('/demo', (_req, res) => {
  const result = ensureDemoAccount();
  const safeUser = result.user;
  _req.session.user = safeUser;
  _req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });
    res.json({ user: safeUser, seeded: result.created });
  });
});

// GET /auth/me
router.get('/me', (req, res) => {
  res.json({ user: req.session?.user ?? null });
});

// PATCH /auth/me — update email alert settings
router.patch('/me', (req, res) => {
  const user = req.session?.user;
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  const { alert_email, email_alerts_enabled } = req.body;
  const db = getDb();
  db.prepare(
    'UPDATE users SET alert_email = COALESCE(@alert_email, alert_email), email_alerts_enabled = COALESCE(@enabled, email_alerts_enabled) WHERE id = @id'
  ).run({
    alert_email: alert_email ?? null,
    enabled: email_alerts_enabled != null ? (email_alerts_enabled ? 1 : 0) : null,
    id: user.id,
  });
  const row = db.prepare('SELECT id, name, alert_email, email_alerts_enabled FROM users WHERE id = ?').get(user.id);
  res.json({ user: row });
});

// GET /auth/me/settings — fetch user email alert settings
router.get('/me/settings', (req, res) => {
  const user = req.session?.user;
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  const row = getDb().prepare('SELECT id, name, alert_email, email_alerts_enabled FROM users WHERE id = ?').get(user.id);
  res.json(row ?? {});
});

// POST /auth/mobile-token — generate a persistent token for mobile apps
router.post('/mobile-token', (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password) return res.status(400).json({ error: 'Username and password required' });

  const userId = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40);
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!row) return res.status(401).json({ error: 'Invalid credentials' });

  if (row.password_hash && !verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = randomBytes(32).toString('hex');
  db.prepare('UPDATE users SET mobile_token = ? WHERE id = ?').run(token, userId);
  res.json({ token, user: { id: row.id, name: row.name } });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

export default router;
