import { getDb } from '../db/schema.js';
import { getSetting } from './settingsService.js';

const BASE = 'https://finnhub.io/api/v1';
const CACHE_TTL_SECONDS = 30;

function apiKey() {
  const key = getSetting('FINNHUB_API_KEY');
  if (!key) throw new Error('Finnhub API key not set. Add it in Settings.');
  return key;
}

async function finnhubGet(path) {
  const url = `${BASE}${path}&token=${apiKey()}`;
  const res = await fetch(url);
  if (res.status === 429) throw new Error('Finnhub rate limit hit — free tier allows 60 req/min');
  if (!res.ok) throw new Error(`Finnhub error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function fetchPrice(ticker) {
  const db = getDb();
  const cached = db.prepare(
    'SELECT * FROM price_cache WHERE ticker = ? AND fetched_at > ?'
  ).get(ticker.toUpperCase(), Math.floor(Date.now() / 1000) - CACHE_TTL_SECONDS);

  if (cached) return cached;

  const sym = ticker.toUpperCase();
  const [quote, metrics] = await Promise.all([
    finnhubGet(`/quote?symbol=${sym}`),
    finnhubGet(`/stock/metric?symbol=${sym}&metric=all`).catch(() => ({ metric: {} })),
  ]);

  const m = metrics.metric ?? {};
  const row = {
    ticker: sym,
    price: quote.c ?? null,
    change_pct: quote.c && quote.pc ? ((quote.c - quote.pc) / quote.pc) * 100 : null,
    volume: null,
    week_52_high: m['52WeekHigh'] ?? null,
    week_52_low: m['52WeekLow'] ?? null,
    market_cap: m.marketCapitalization ? m.marketCapitalization * 1e6 : null,
  };

  db.prepare(`
    INSERT OR REPLACE INTO price_cache
      (ticker, price, change_pct, volume, week_52_high, week_52_low, market_cap, fetched_at)
    VALUES
      (@ticker, @price, @change_pct, @volume, @week_52_high, @week_52_low, @market_cap, unixepoch())
  `).run(row);

  if (row.price != null) {
    db.prepare('INSERT INTO price_history (ticker, price) VALUES (?, ?)').run(sym, row.price);
    // Keep only last 200 points per ticker to avoid unbounded growth
    db.prepare(`
      DELETE FROM price_history WHERE ticker = ? AND id NOT IN (
        SELECT id FROM price_history WHERE ticker = ? ORDER BY recorded_at DESC LIMIT 200
      )
    `).run(sym, sym);
  }

  return { ...row, fetched_at: Math.floor(Date.now() / 1000) };
}

export async function fetchAllPrices(tickers) {
  return Promise.all(tickers.map(t => fetchPrice(t).catch(err => ({ ticker: t, error: err.message }))));
}
