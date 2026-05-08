import { getDb } from '../db/schema.js';
import { getSetting } from './settingsService.js';

const BASE = 'https://finnhub.io/api/v1';
const CACHE = new Map(); // sym → { ts, data }
const CACHE_TTL = 4 * 3600; // 4 hours

function apiKey() {
  return getSetting('FINNHUB_API_KEY') ?? '';
}

export async function fetchCandles(ticker) {
  const sym = ticker.toUpperCase();
  const now = Math.floor(Date.now() / 1000);

  const cached = CACHE.get(sym);
  if (cached && now - cached.ts < CACHE_TTL) return cached.data;

  const key = apiKey();
  if (key) {
    try {
      const from = now - 365 * 86400;
      const url = `${BASE}/stock/candle?symbol=${sym}&resolution=D&from=${from}&to=${now}&token=${key}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.s === 'ok' && json.c?.length) {
          const data = { closes: json.c, timestamps: json.t };
          CACHE.set(sym, { ts: now, data });
          return data;
        }
      }
    } catch {
      // fall through to local
    }
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
