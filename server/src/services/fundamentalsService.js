import { getDb } from '../db/schema.js';
import { getSetting } from './settingsService.js';

const BASE = 'https://finnhub.io/api/v1';
const CACHE_TTL = 6 * 60 * 60; // 6 hours

function apiKey() {
  const key = getSetting('FINNHUB_API_KEY');
  if (!key) throw new Error('Finnhub API key not set. Add it in Settings.');
  return key;
}

async function finnhubGet(path) {
  const url = `${BASE}${path}&token=${apiKey()}`;
  const res = await fetch(url);
  if (res.status === 429) throw new Error('Finnhub rate limit');
  if (!res.ok) return {};
  return res.json();
}

export async function fetchFundamentals(ticker) {
  const db = getDb();
  const sym = ticker.toUpperCase();
  const cached = db.prepare(
    'SELECT * FROM fundamentals_cache WHERE ticker = ? AND fetched_at > ?'
  ).get(sym, Math.floor(Date.now() / 1000) - CACHE_TTL);
  if (cached) return cached;

  const [profile, metricsRes, recs, target, earnings] = await Promise.all([
    finnhubGet(`/stock/profile2?symbol=${sym}`),
    finnhubGet(`/stock/metric?symbol=${sym}&metric=all`),
    finnhubGet(`/stock/recommendation?symbol=${sym}`),
    finnhubGet(`/stock/price-target?symbol=${sym}`),
    finnhubGet(`/stock/earnings?symbol=${sym}&limit=4`),
  ]);

  const m = metricsRes.metric ?? {};
  const rec = Array.isArray(recs) ? recs[0] ?? {} : {};
  const todayISO = new Date().toISOString().slice(0, 10);
  const earningsArr = Array.isArray(earnings) ? earnings : [];
  const nextEarnings = earningsArr.find(e => e.date >= todayISO) ?? earningsArr[0] ?? {};

  const row = {
    ticker: sym,
    sector:        profile.finnhubIndustry ?? null,
    industry:      profile.finnhubIndustry ?? null,
    company_name:  profile.name ?? null,
    logo_url:      profile.logo ?? null,
    web_url:       profile.weburl ?? null,
    beta:          m.beta ?? null,
    pe_ratio:      m.peNormalizedAnnual ?? m.peBasicExclExtraTTM ?? null,
    ps_ratio:      m.psTTM ?? null,
    pb_ratio:      m.pbAnnual ?? null,
    eps_growth:    m.epsGrowthTTMYoy ?? null,
    revenue_growth: m.revenueGrowthTTMYoy ?? null,
    roe:           m.roeRfy ?? null,
    debt_equity:   m.totalDebt2TotalEquityAnnual ?? null,
    dividend_yield: m.dividendYieldIndicatedAnnual ?? null,
    strong_buy:    rec.strongBuy ?? null,
    buy_count:     rec.buy ?? null,
    hold_count:    rec.hold ?? null,
    sell_count:    rec.sell ?? null,
    strong_sell:   rec.strongSell ?? null,
    target_high:   target.targetHigh ?? null,
    target_low:    target.targetLow ?? null,
    target_mean:   target.targetMean ?? null,
    target_median: target.targetMedian ?? null,
    next_earnings_date:     nextEarnings.date ?? null,
    next_earnings_estimate: nextEarnings.epsEstimate ?? null,
  };

  db.prepare(`
    INSERT OR REPLACE INTO fundamentals_cache
      (ticker, sector, industry, company_name, logo_url, web_url,
       beta, pe_ratio, ps_ratio, pb_ratio, eps_growth, revenue_growth,
       roe, debt_equity, dividend_yield,
       strong_buy, buy_count, hold_count, sell_count, strong_sell,
       target_high, target_low, target_mean, target_median,
       next_earnings_date, next_earnings_estimate, fetched_at)
    VALUES
      (@ticker, @sector, @industry, @company_name, @logo_url, @web_url,
       @beta, @pe_ratio, @ps_ratio, @pb_ratio, @eps_growth, @revenue_growth,
       @roe, @debt_equity, @dividend_yield,
       @strong_buy, @buy_count, @hold_count, @sell_count, @strong_sell,
       @target_high, @target_low, @target_mean, @target_median,
       @next_earnings_date, @next_earnings_estimate, unixepoch())
  `).run(row);

  return row;
}
