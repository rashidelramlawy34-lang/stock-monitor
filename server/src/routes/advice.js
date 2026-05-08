import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { discoverStocks } from '../services/aiService.js';
import { fetchPrice } from '../services/priceService.js';
import { fetchNews } from '../services/newsService.js';
import { fetchFundamentals } from '../services/fundamentalsService.js';
import { getDb } from '../db/schema.js';
import { getSetting } from '../services/settingsService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function getClient() {
  const key = getSetting('ANTHROPIC_API_KEY');
  if (!key) throw new Error('Anthropic API key not set. Add it in Settings.');
  return new Anthropic({ apiKey: key });
}
const PROMPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../prompts');

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

router.use(requireAuth);

router.get('/discover', async (req, res) => {
  try {
    const userId = req.user.id;
    const holdings = getDb()
      .prepare('SELECT * FROM holdings WHERE user_id = ?')
      .all(userId);
    if (holdings.length === 0) return res.json({ suggestions: [], reasoning: 'No holdings to base recommendations on.' });
    const result = await discoverStocks(holdings);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/digest', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const holdings = db.prepare('SELECT * FROM holdings WHERE user_id = ?').all(userId);
    if (holdings.length === 0) return res.json({ summary: 'Add stocks to your portfolio to generate a digest.' });

    const prices = db.prepare(
      `SELECT * FROM price_cache WHERE ticker IN (${holdings.map(() => '?').join(',')}) ORDER BY fetched_at DESC`
    ).all(holdings.map(h => h.ticker));

    const priceMap = Object.fromEntries(prices.map(p => [p.ticker, p]));
    const enriched = holdings.map(h => ({
      ticker: h.ticker,
      shares: h.shares,
      cost_basis: h.cost_basis,
      current_price: priceMap[h.ticker]?.price ?? null,
      change_pct: priceMap[h.ticker]?.change_pct ?? null,
      pnl: priceMap[h.ticker]?.price != null
        ? ((priceMap[h.ticker].price - h.cost_basis) * h.shares).toFixed(2)
        : null,
    }));

    const template = readFileSync(path.join(PROMPTS_DIR, 'digest.txt'), 'utf8');
    const prompt = template.replace('{{HOLDINGS_JSON}}', JSON.stringify(enriched, null, 2));

    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: 'You are a concise portfolio analyst. Write in plain prose.',
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ summary: message.content[0].text.trim() });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const userId = req.user.id;
    const db = getDb();

    // Check user-scoped cache first (valid for 1 hour)
    const cached = db.prepare(
      'SELECT * FROM ai_advice WHERE ticker = ? AND user_id = ? AND generated_at > ? ORDER BY generated_at DESC LIMIT 1'
    ).get(ticker, userId, Math.floor(Date.now() / 1000) - 3600);
    if (cached) return res.json(cached);

    const [priceData, newsItems, fundamentals] = await Promise.all([
      fetchPrice(ticker),
      fetchNews(ticker),
      fetchFundamentals(ticker),
    ]);

    // Build advice inline with user_id scoping
    const template = readFileSync(path.join(PROMPTS_DIR, 'advice.txt'), 'utf8');
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
      .replace('{{TICKER}}',           ticker)
      .replace('{{COMPANY_NAME}}',     fundamentals.company_name ?? ticker)
      .replace('{{SECTOR}}',           fundamentals.sector ?? 'Unknown')
      .replace('{{INDUSTRY}}',         fundamentals.industry ?? 'Unknown')
      .replace('{{PRICE}}',            fmt(price))
      .replace('{{CHANGE_PCT}}',       fmt(priceData.change_pct))
      .replace('{{WEEK_52_HIGH}}',     fmt(high))
      .replace('{{WEEK_52_LOW}}',      fmt(low))
      .replace('{{WEEK_52_POSITION}}', week52Position)
      .replace('{{PE_RATIO}}',         fmt(fundamentals.pe_ratio))
      .replace('{{PS_RATIO}}',         fmt(fundamentals.ps_ratio))
      .replace('{{PB_RATIO}}',         fmt(fundamentals.pb_ratio))
      .replace('{{BETA}}',             fmt(fundamentals.beta))
      .replace('{{MARKET_CAP_LABEL}}', marketCapLabel(priceData.market_cap))
      .replace('{{EPS_GROWTH}}',       fmt(fundamentals.eps_growth))
      .replace('{{REVENUE_GROWTH}}',   fmt(fundamentals.revenue_growth))
      .replace('{{ROE}}',              fmt(fundamentals.roe))
      .replace('{{DEBT_EQUITY}}',      fmt(fundamentals.debt_equity))
      .replace('{{DIVIDEND_YIELD}}',   fmt(fundamentals.dividend_yield))
      .replace('{{STRONG_BUY}}',       fundamentals.strong_buy ?? 0)
      .replace('{{BUY_COUNT}}',        fundamentals.buy_count ?? 0)
      .replace('{{HOLD_COUNT}}',       fundamentals.hold_count ?? 0)
      .replace('{{SELL_COUNT}}',       fundamentals.sell_count ?? 0)
      .replace('{{STRONG_SELL}}',      fundamentals.strong_sell ?? 0)
      .replace('{{TARGET_MEAN}}',      fmt(fundamentals.target_mean))
      .replace('{{TARGET_HIGH}}',      fmt(fundamentals.target_high))
      .replace('{{TARGET_LOW}}',       fmt(fundamentals.target_low))
      .replace('{{UPSIDE_PCT}}',       upsidePct)
      .replace('{{NEWS}}',             newsText || 'No recent news available.');

    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a senior equity analyst. Respond only with valid JSON.',
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
    let parsed;
    try { parsed = JSON.parse(raw); } catch { parsed = { recommendation: 'hold', reasoning: raw, confidence: 0.5 }; }

    const row = {
      ticker,
      user_id: userId,
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
        (ticker, user_id, recommendation, reasoning, confidence, bull_case, bear_case, price_target, stop_loss, key_risks, key_catalysts)
      VALUES
        (@ticker, @user_id, @recommendation, @reasoning, @confidence, @bull_case, @bear_case, @price_target, @stop_loss, @key_risks, @key_catalysts)
    `).run(row);

    res.json({ ...row, generated_at: Math.floor(Date.now() / 1000) });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
