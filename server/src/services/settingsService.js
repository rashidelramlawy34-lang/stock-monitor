import { getDb } from '../db/schema.js';

export function getSetting(key) {
  // Env var takes precedence over DB setting
  if (process.env[key]) return process.env[key];
  try {
    const row = getDb().prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
    return row?.value ?? null;
  } catch {
    return null;
  }
}
