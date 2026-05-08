import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../db/schema.js';
import { fetchFundamentals } from './fundamentalsService.js';
import { fetchPrice } from './priceService.js';
import { getSetting } from './settingsService.js';

const BASE = 'https://finnhub.io/api/v1';
const PROMPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../prompts');

function getAnthropicClient() {
  const key = getSetting('ANTHROPIC_API_KEY');
  if (!key) throw new Error('Anthropic API key not set. Add it in Settings.');
  return new Anthropic({ apiKey: key });
}

function apiKey() { return getSetting('FINNHUB_API_KEY') ?? ''; }

async function finnhubGet(path) {
  const res = await fetch(`${BASE}${path}&token=${apiKey()}`);
  if (!res.ok) return null;
  return res.json();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v ?? 0)); }

function marketCapLabel(cap) {
  if (!cap) return 'Unknown';
  if (cap > 200e9) return 'Mega-cap';
  if (cap > 10e9) return 'Large-cap';
  if (cap > 2e9) return 'Mid-cap';
  if (cap > 300e6) return 'Small-cap';
  return 'Micro-cap';
}

export async function runHRHRScan() {
  const db = getDb();
  const holdings = db.prepare('SELECT ticker FROM holdings').all();
  if (holdings.length === 0) {
    console.log('[HRHR] No holdings — skipping scan');
    return [];
  }

  console.log('[HRHR] Fetching peers for', holdings.length, 'holdings…');

  // 1. Get peers for each holding
  const peerResults = await Promise.all(
    holdings.map(h => finnhubGet(`/stock/peers?symbol=${h.ticker}`).catch(() => []))
  );
  const holdingTickers = new Set(holdings.map(h => h.ticker));
  const allPeers = [...new Set(peerResults.flat().filter(t => t && !holdingTickers.has(t)))];
  const candidates = allPeers.slice(0, 30);
  console.log('[HRHR]', candidates.length, 'candidates to score');

  // 2. Batch-fetch fundamentals + price (5 per batch, 300ms delay)
  const enriched = [];
  for (let i = 0; i < candidates.length; i += 5) {
    const batch = candidates.slice(i, i + 5);
    const results = await Promise.all(batch.map(async (ticker) => {
      try {
        const [fund, price] = await Promise.all([fetchFundamentals(ticker), fetchPrice(ticker)]);
        return { ticker, fund, price };
      } catch { return null; }
    }));
    enriched.push(...results.filter(Boolean));
    if (i + 5 < candidates.length) await sleep(300);
  }

  // 3. Score candidates
  const scored = enriched.map(({ ticker, fund, price }) => {
    const upside = fund.target_mean && price.price
      ? (fund.target_mean - price.price) / price.price * 100 : 0;
    const totalAnalysts = (fund.strong_buy ?? 0) + (fund.buy_count ?? 0) + (fund.hold_count ?? 0) + (fund.sell_count ?? 0) + (fund.strong_sell ?? 0);
    const buyRatio = totalAnalysts > 0 ? ((fund.strong_buy ?? 0) + (fund.buy_count ?? 0)) / totalAnalysts : 0;
    const betaNorm = clamp(fund.beta, 0, 3) / 3;
    return { ticker, fund, price, upside, buyRatio, betaNorm, totalAnalysts };
  }).filter(c => c.price?.price > 0 && c.totalAnalysts > 0);

  const maxUpside = Math.max(...scored.map(c => c.upside), 1);
  const finalScored = scored.map(c => ({
    ...c,
    score: (c.upside / maxUpside * 0.4) + (c.betaNorm * 0.3) + (c.buyRatio * 0.3),
  })).sort((a, b) => b.score - a.score).slice(0, 12);

  if (finalScored.length === 0) {
    console.log('[HRHR] No scoreable candidates');
    return [];
  }

  // 4. Build candidates JSON for Claude
  const candidatesData = finalScored.map(c => ({
    ticker: c.ticker,
    company_name: c.fund.company_name,
    sector: c.fund.sector,
    current_price: c.price.price,
    upside_pct: Math.round(c.upside * 10) / 10,
    beta: c.fund.beta,
    market_cap: marketCapLabel(c.price.market_cap),
    pe_ratio: c.fund.pe_ratio,
    strong_buy: c.fund.strong_buy ?? 0,
    buy_count: c.fund.buy_count ?? 0,
    hold_count: c.fund.hold_count ?? 0,
    sell_count: c.fund.sell_count ?? 0,
    target_mean: c.fund.target_mean,
    eps_growth: c.fund.eps_growth,
    revenue_growth: c.fund.revenue_growth,
  }));

  // 5. Claude analysis
  console.log('[HRHR] Calling Claude for', finalScored.length, 'candidates…');
  const template = readFileSync(path.join(PROMPTS_DIR, 'hrhr.txt'), 'utf8');
  const prompt = template
    .replace('{{CANDIDATES_JSON}}', JSON.stringify(candidatesData, null, 2))
    .replace('{{COUNT}}', String(finalScored.length));

  let claudeAnalysis = [];
  try {
    const client = getAnthropicClient();
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'You are an aggressive-growth equity analyst. Respond only with valid JSON. Keep bull_case and key_catalyst concise (1-2 sentences max) to stay within token limits.',
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = msg.content[0].text.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
    claudeAnalysis = JSON.parse(raw);
  } catch (err) {
    console.error('[HRHR] Claude parse error:', err.message);
    claudeAnalysis = finalScored.map(c => ({ ticker: c.ticker, risk_label: 'High', bull_case: '', entry_zone: '', key_catalyst: '', conviction: 0.5 }));
  }

  // 6. Merge numeric data with Claude analysis
  const analysisMap = Object.fromEntries((claudeAnalysis ?? []).map(a => [a.ticker, a]));
  const merged = finalScored.map(c => ({
    ticker: c.ticker,
    company_name: c.fund.company_name,
    sector: c.fund.sector,
    logo_url: c.fund.logo_url,
    current_price: c.price.price,
    upside_pct: Math.round(c.upside * 10) / 10,
    beta: c.fund.beta,
    market_cap: marketCapLabel(c.price.market_cap),
    pe_ratio: c.fund.pe_ratio,
    strong_buy: c.fund.strong_buy ?? 0,
    buy_count: c.fund.buy_count ?? 0,
    hold_count: c.fund.hold_count ?? 0,
    sell_count: c.fund.sell_count ?? 0,
    strong_sell: c.fund.strong_sell ?? 0,
    target_mean: c.fund.target_mean,
    score: Math.round(c.score * 100) / 100,
    ...(analysisMap[c.ticker] ?? {}),
  }));

  // 7. Cache results
  db.prepare('INSERT OR REPLACE INTO hrhr_cache (id, results, generated_at) VALUES (1, ?, unixepoch())')
    .run(JSON.stringify(merged));

  console.log('[HRHR] Scan complete —', merged.length, 'candidates cached');
  return merged;
}

export function getCachedHRHR() {
  const row = getDb().prepare('SELECT results, generated_at FROM hrhr_cache WHERE id = 1').get();
  if (!row) return { results: [], generated_at: null };
  return { results: JSON.parse(row.results), generated_at: row.generated_at };
}

export function startHRHRScanner() {
  console.log('[HRHR] Background scanner started (runs on start + every 6h)');
  runHRHRScan().catch(err => console.error('[HRHR] Scan error:', err.message));
  setInterval(() => runHRHRScan().catch(err => console.error('[HRHR] Scan error:', err.message)), 6 * 60 * 60 * 1000);
}
