import { getDb } from '../db/schema.js';

export async function fetchCandles(ticker) {
  const db = getDb();
  const sym = ticker.toUpperCase();

  const since = Math.floor(Date.now() / 1000) - 14 * 86400;
  const rows = db.prepare(
    'SELECT price, recorded_at FROM price_history WHERE ticker = ? AND recorded_at > ? ORDER BY recorded_at ASC'
  ).all(sym, since);

  if (rows.length === 0) {
    return { closes: [], timestamps: [] };
  }

  return {
    closes: rows.map(r => r.price),
    timestamps: rows.map(r => r.recorded_at),
  };
}
