import { getDb } from '../db/schema.js';

export function requireAuth(req, res, next) {
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }
  // Mobile token auth (X-Mobile-Token header)
  const token = req.headers['x-mobile-token'];
  if (token) {
    const row = getDb().prepare('SELECT id, name FROM users WHERE mobile_token = ?').get(token);
    if (row) {
      req.user = { id: row.id, name: row.name };
      return next();
    }
  }
  res.status(401).json({ error: 'Not authenticated' });
}
