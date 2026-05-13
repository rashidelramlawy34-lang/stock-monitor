import OpenAI from 'openai';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../db/schema.js';
import { getSetting } from './settingsService.js';

const DEFAULT_AI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.5';
const DEEP_AI_MODEL = process.env.OPENAI_DEEP_MODEL || 'gpt-5.5';

function getClient() {
  const key = getSetting('OPENAI_API_KEY');
  if (!key) throw new Error('OpenAI API key not set. Add it in Settings.');
  return new OpenAI({ apiKey: key });
}
const PROMPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../prompts');

function loadPrompt(name) {
  return readFileSync(path.join(PROMPTS_DIR, `${name}.txt`), 'utf8');
}

function fmt(v, decimals = 2) {
  return v != null ? Number(v).toFixed(decimals) : 'N/A';
}

function marketCapLabel(cap) {
  if (!cap) return 'Unknown';
  if (cap > 200e9) return 'Mega-cap (>$200B)';
  if (cap > 10e9)  return 'Large-cap ($10B–$200B)';
  if (cap > 2e9)   return 'Mid-cap ($2B–$10B)';
  if (cap > 300e6) return 'Small-cap ($300M–$2B)';
  return 'Micro-cap (<$300M)';
}

export async function completeJson({ prompt, instructions, maxOutputTokens = 1024, deep = false }) {
  const response = await getClient().responses.create({
    model: deep ? DEEP_AI_MODEL : DEFAULT_AI_MODEL,
    instructions,
    input: prompt,
    max_output_tokens: maxOutputTokens,
    text: { format: { type: 'json_object' } },
    reasoning: { effort: deep ? 'medium' : 'low' },
  });
  return response.output_text.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
}

export async function completeText({ prompt, instructions, maxOutputTokens = 512, deep = false }) {
  const response = await getClient().responses.create({
    model: deep ? DEEP_AI_MODEL : DEFAULT_AI_MODEL,
    instructions,
    input: prompt,
    max_output_tokens: maxOutputTokens,
    reasoning: { effort: deep ? 'medium' : 'low' },
  });
  return response.output_text.trim();
}

export async function getAdvice(ticker, priceData, newsItems, fundamentals = {}) {
  const db = getDb();

  const cached = db.prepare(
    'SELECT * FROM ai_advice WHERE ticker = ? AND generated_at > ? ORDER BY generated_at DESC LIMIT 1'
  ).get(ticker.toUpperCase(), Math.floor(Date.now() / 1000) - 3600);
  if (cached) return cached;

  const template = loadPrompt('advice');
  const newsText = newsItems.slice(0, 6).map(n =>
    `[${(n.sentiment ?? 'neutral').toUpperCase()}] ${n.headline}`
  ).join('\n');

  const price = priceData.price ?? 0;
  const high = priceData.week_52_high ?? 0;
  const low = priceData.week_52_low ?? 0;
  const week52Position = high > low ? fmt((price - low) / (high - low) * 100, 0) : 'N/A';
  const upsidePct = fundamentals.target_mean && price
    ? fmt((fundamentals.target_mean - price) / price * 100, 1) : 'N/A';

  const prompt = template
    .replace('{{TICKER}}',          ticker.toUpperCase())
    .replace('{{COMPANY_NAME}}',    fundamentals.company_name ?? ticker.toUpperCase())
    .replace('{{SECTOR}}',          fundamentals.sector ?? 'Unknown')
    .replace('{{INDUSTRY}}',        fundamentals.industry ?? 'Unknown')
    .replace('{{PRICE}}',           fmt(price))
    .replace('{{CHANGE_PCT}}',      fmt(priceData.change_pct))
    .replace('{{WEEK_52_HIGH}}',    fmt(high))
    .replace('{{WEEK_52_LOW}}',     fmt(low))
    .replace('{{WEEK_52_POSITION}}', week52Position)
    .replace('{{PE_RATIO}}',        fmt(fundamentals.pe_ratio))
    .replace('{{PS_RATIO}}',        fmt(fundamentals.ps_ratio))
    .replace('{{PB_RATIO}}',        fmt(fundamentals.pb_ratio))
    .replace('{{BETA}}',            fmt(fundamentals.beta))
    .replace('{{MARKET_CAP_LABEL}}', marketCapLabel(priceData.market_cap))
    .replace('{{EPS_GROWTH}}',      fmt(fundamentals.eps_growth))
    .replace('{{REVENUE_GROWTH}}',  fmt(fundamentals.revenue_growth))
    .replace('{{ROE}}',             fmt(fundamentals.roe))
    .replace('{{DEBT_EQUITY}}',     fmt(fundamentals.debt_equity))
    .replace('{{DIVIDEND_YIELD}}',  fmt(fundamentals.dividend_yield))
    .replace('{{STRONG_BUY}}',      fundamentals.strong_buy ?? 0)
    .replace('{{BUY_COUNT}}',       fundamentals.buy_count ?? 0)
    .replace('{{HOLD_COUNT}}',      fundamentals.hold_count ?? 0)
    .replace('{{SELL_COUNT}}',      fundamentals.sell_count ?? 0)
    .replace('{{STRONG_SELL}}',     fundamentals.strong_sell ?? 0)
    .replace('{{TARGET_MEAN}}',     fmt(fundamentals.target_mean))
    .replace('{{TARGET_HIGH}}',     fmt(fundamentals.target_high))
    .replace('{{TARGET_LOW}}',      fmt(fundamentals.target_low))
    .replace('{{UPSIDE_PCT}}',      upsidePct)
    .replace('{{NEWS}}',            newsText || 'No recent news available.');

  const raw = await completeJson({
    prompt,
    maxOutputTokens: 1024,
    instructions: 'You are a senior equity analyst. Respond only with valid JSON. This is analytical support, not personalized financial advice.',
  });
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { recommendation: 'hold', reasoning: raw, confidence: 0.5 };
  }

  const row = {
    ticker: ticker.toUpperCase(),
    recommendation: ['buy', 'hold', 'sell'].includes(parsed.recommendation) ? parsed.recommendation : 'hold',
    reasoning:      parsed.reasoning ?? '',
    confidence:     parsed.confidence ?? 0.5,
    bull_case:      parsed.bull_case ?? null,
    bear_case:      parsed.bear_case ?? null,
    price_target:   parsed.price_target ?? null,
    stop_loss:      parsed.stop_loss ?? null,
    key_risks:      parsed.key_risks ? JSON.stringify(parsed.key_risks) : null,
    key_catalysts:  parsed.key_catalysts ? JSON.stringify(parsed.key_catalysts) : null,
  };

  db.prepare(`
    INSERT INTO ai_advice
      (ticker, recommendation, reasoning, confidence, bull_case, bear_case, price_target, stop_loss, key_risks, key_catalysts)
    VALUES
      (@ticker, @recommendation, @reasoning, @confidence, @bull_case, @bear_case, @price_target, @stop_loss, @key_risks, @key_catalysts)
  `).run(row);

  return { ...row, generated_at: Math.floor(Date.now() / 1000) };
}

export async function getPortfolioCoach(holdings, allAdvice, allFundamentals, allPrices) {
  const holdingsData = holdings.map(h => {
    const price = allPrices[h.ticker]?.price ?? 0;
    const pnlPct = price && h.cost_basis ? ((price - h.cost_basis) / h.cost_basis * 100).toFixed(2) : 'N/A';
    const advice = allAdvice[h.ticker] ?? {};
    const fund = allFundamentals[h.ticker] ?? {};
    return {
      ticker: h.ticker,
      shares: h.shares,
      cost_basis: h.cost_basis,
      current_price: price,
      pnl_pct: pnlPct,
      recommendation: advice.recommendation ?? 'N/A',
      bull_case: advice.bull_case ?? null,
      bear_case: advice.bear_case ?? null,
      beta: fund.beta ?? null,
      pe_ratio: fund.pe_ratio ?? null,
      sector: fund.sector ?? 'Unknown',
    };
  });

  const template = loadPrompt('coach');
  const prompt = template.replace('{{HOLDINGS_JSON}}', JSON.stringify(holdingsData, null, 2));

  const raw = await completeJson({
    prompt,
    maxOutputTokens: 2048,
    deep: true,
    instructions: 'You are a senior portfolio manager. Respond only with valid JSON. This is analytical support, not personalized financial advice.',
  });
  try { return JSON.parse(raw); } catch { return { summary: raw, score: 50, overall_health: 'Balanced' }; }
}

export async function discoverStocks(holdings) {
  const template = loadPrompt('discover');
  const holdingsList = holdings.map(h => h.ticker).join(', ');
  const prompt = template.replace('{{HOLDINGS}}', holdingsList);

  const raw = await completeJson({
    prompt,
    maxOutputTokens: 1024,
    instructions: 'You are a financial analyst. Respond only with valid JSON. This is analytical support, not personalized financial advice.',
  });
  try { return JSON.parse(raw); } catch { return { suggestions: [], reasoning: raw }; }
}
