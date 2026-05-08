import { getDb } from '../db/schema.js';
import yahooFinance from 'yahoo-finance2';

const CACHE = new Map(); // sym → { ts, data }
const CACHE_TTL = 4 * 3600; // 4 hours

export async function fetchCandles(ticker) {
  const sym = ticker.toUpperCase();
  const now = Math.floor(Date.now() / 1000);

  const cached = CACHE.get(sym);
  if (cached && now - cached.ts < CACHE_TTL) return cached.data;

  try {
    const period1 = new Date(Date.now() - 365 * 86400 * 1000);
    const result = await yahooFinance.historical(sym, {
      period1,
      interval: '1d',
    }, { validateResult: false });

    if (result?.length >= 2) {
      const closes = result.map(r => r.adjClose ?? r.close);
      const timestamps = result.map(r => Math.floor(new Date(r.date).getTime() / 1000));
      const data = { closes, timestamps };
      CACHE.set(sym, { ts: now, data });
      return data;
    }
  } catch {
    // fall through to local
  }

  return fetchLocal(sym);
}

function fetchLocal(sym) {
  const db = getDb();
  const since = Math.floor(Date.now() / 1000) - 90 * 86400;
  const rows = db.prepare(
    'SELECT price, recorded_at FROM price_history WHERE ticker = ? AND recorded_at > ? ORDER BY recorded_at ASC'
  ).all(sym, since);

  if (rows.length === 0) return { closes: [], timestamps: [] };
  return {
    closes: rows.map(r => r.price),
    timestamps: rows.map(r => r.recorded_at),
  };
}
