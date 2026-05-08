import { getDb } from '../db/schema.js';

const CACHE = new Map(); // sym → { ts, data }
const CACHE_TTL = 4 * 3600;

const YF_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; stock-monitor/1.0)' };

export async function fetchCandles(ticker) {
  const sym = ticker.toUpperCase();
  const now = Math.floor(Date.now() / 1000);

  const cached = CACHE.get(sym);
  if (cached && now - cached.ts < CACHE_TTL) return cached.data;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=2y`;
    const res = await fetch(url, { headers: YF_HEADERS });
    if (res.ok) {
      const json = await res.json();
      const result = json?.chart?.result?.[0];
      const timestamps = result?.timestamp;
      const closes =
        result?.indicators?.adjclose?.[0]?.adjclose ??
        result?.indicators?.quote?.[0]?.close;

      if (timestamps?.length >= 2 && closes?.length >= 2) {
        const data = { closes, timestamps };
        CACHE.set(sym, { ts: now, data });
        return data;
      }
    }
  } catch {
    // fall through
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
