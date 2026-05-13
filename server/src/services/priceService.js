import { getDb } from '../db/schema.js';
import { getSetting } from './settingsService.js';

const BASE = 'https://finnhub.io/api/v1';
const CACHE_TTL_SECONDS = 30;
const YF_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; stock-monitor/1.0)' };

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

async function fetchYahooPrice(sym) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;
  const res = await fetch(url, { headers: YF_HEADERS });
  if (!res.ok) throw new Error(`Yahoo Finance error ${res.status}: ${res.statusText}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta) throw new Error(`No quote data for ${sym}`);

  const quote = result.indicators?.quote?.[0] ?? {};
  const closes = (quote.close ?? []).filter(v => Number.isFinite(v) && v > 0);
  const volumes = (quote.volume ?? []).filter(v => Number.isFinite(v));
  const price = Number.isFinite(meta.regularMarketPrice) && meta.regularMarketPrice > 0
    ? meta.regularMarketPrice
    : closes.at(-1);
  const previousClose = Number.isFinite(closes.at(-2)) && closes.at(-2) > 0
    ? closes.at(-2)
    : meta.chartPreviousClose;

  if (!Number.isFinite(price) || price <= 0) throw new Error(`No live price for ${sym}`);

  return {
    ticker: sym,
    price,
    change_pct: previousClose ? ((price - previousClose) / previousClose) * 100 : null,
    volume: volumes.at(-1) ?? null,
    week_52_high: meta.fiftyTwoWeekHigh ?? null,
    week_52_low: meta.fiftyTwoWeekLow ?? null,
    market_cap: meta.marketCap ?? null,
    currency: meta.currency ?? null,
    exchange: meta.exchangeName ?? meta.fullExchangeName ?? null,
  };
}

async function fetchFinnhubPrice(sym) {
  const [quote, metrics] = await Promise.all([
    finnhubGet(`/quote?symbol=${sym}`),
    finnhubGet(`/stock/metric?symbol=${sym}&metric=all`).catch(() => ({ metric: {} })),
  ]);

  if (!Number.isFinite(quote.c) || quote.c <= 0) throw new Error(`No live price for ${sym}`);

  const m = metrics.metric ?? {};
  return {
    ticker: sym,
    price: quote.c,
    change_pct: quote.pc ? ((quote.c - quote.pc) / quote.pc) * 100 : null,
    volume: null,
    week_52_high: m['52WeekHigh'] ?? null,
    week_52_low: m['52WeekLow'] ?? null,
    market_cap: m.marketCapitalization ? m.marketCapitalization * 1e6 : null,
    currency: null,
    exchange: null,
  };
}

export async function fetchPrice(ticker) {
  const db = getDb();
  const sym = ticker.toUpperCase();
  const cached = db.prepare(
    'SELECT * FROM price_cache WHERE ticker = ? AND fetched_at > ?'
  ).get(sym, Math.floor(Date.now() / 1000) - CACHE_TTL_SECONDS);

  if (cached && Number.isFinite(cached.price) && cached.price > 0) return cached;

  const row = await fetchYahooPrice(sym).catch(() => fetchFinnhubPrice(sym));

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
