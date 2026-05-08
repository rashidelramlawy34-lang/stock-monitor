import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAdvice, discoverStocks } from '../services/aiService.js';
import { fetchPrice } from '../services/priceService.js';
import { fetchNews } from '../services/newsService.js';
import { fetchFundamentals } from '../services/fundamentalsService.js';
import { getDb } from '../db/schema.js';
import { getSetting } from '../services/settingsService.js';

const router = Router();

function getClient() {
  const key = getSetting('ANTHROPIC_API_KEY');
  if (!key) throw new Error('Anthropic API key not set. Add it in Settings.');
  return new Anthropic({ apiKey: key });
}
const PROMPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../prompts');

router.get('/discover', async (req, res) => {
  try {
    const holdings = getDb().prepare('SELECT * FROM holdings').all();
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
    const holdings = db.prepare('SELECT * FROM holdings').all();
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
    const [priceData, newsItems, fundamentals] = await Promise.all([
      fetchPrice(ticker),
      fetchNews(ticker),
      fetchFundamentals(ticker),
    ]);
    const advice = await getAdvice(ticker, priceData, newsItems, fundamentals);
    res.json(advice);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
