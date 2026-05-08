import { Router } from 'express';
import { getDb } from '../db/schema.js';

const router = Router();

const ALLOWED_KEYS = ['ANTHROPIC_API_KEY', 'FINNHUB_API_KEY'];

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM app_settings').all();
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  // Mask keys — return only whether they are set, not the actual value
  const masked = Object.fromEntries(
    ALLOWED_KEYS.map(k => [k, settings[k] ? '***set***' : ''])
  );
  res.json(masked);
});

router.post('/', (req, res) => {
  const db = getDb();
  const updates = req.body; // { ANTHROPIC_API_KEY: '...', FINNHUB_API_KEY: '...' }
  const stmt = db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)');
  const del = db.prepare('DELETE FROM app_settings WHERE key = ?');

  for (const key of ALLOWED_KEYS) {
    if (!(key in updates)) continue;
    const val = String(updates[key] ?? '').trim();
    if (val === '' || val === '***set***') {
      // empty string = clear (only if explicitly passed as empty, not masked)
      if (val === '') del.run(key);
    } else {
      stmt.run(key, val);
    }
  }

  res.json({ ok: true });
});

export default router;
