import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../db/schema.js';

const BASE = 'https://finnhub.io/api/v1';
const NEWS_CACHE_TTL = 15 * 60;
const PROMPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../prompts');

const client = new Anthropic();

function apiKey() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY is not set in .env');
  return key;
}

async function tagSentiment(ticker, articles) {
  if (articles.length === 0) return [];
  try {
    const template = readFileSync(path.join(PROMPTS_DIR, 'sentiment.txt'), 'utf8');
    const headlines = articles.map((a, i) => `${i}. ${a.headline}`).join('\n');
    const prompt = template.replace('{{TICKER}}', ticker).replace('{{HEADLINES}}', headlines);

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: 'You are a financial analyst. Respond only with valid JSON.',
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = msg.content[0].text.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
    const tags = JSON.parse(raw);
    return tags;
  } catch {
    return [];
  }
}

export async function fetchNews(ticker) {
  const db = getDb();
  const cutoff = Math.floor(Date.now() / 1000) - NEWS_CACHE_TTL;
  const cached = db.prepare(
    'SELECT * FROM news_cache WHERE ticker = ? AND fetched_at > ? ORDER BY published_at DESC LIMIT 10'
  ).all(ticker.toUpperCase(), cutoff);

  if (cached.length > 0) return cached;

  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const url = `${BASE}/company-news?symbol=${ticker.toUpperCase()}&from=${from}&to=${to}&token=${apiKey()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub news error ${res.status}`);
  const articles = (await res.json()).slice(0, 10).map(a => ({
    ticker: ticker.toUpperCase(),
    headline: a.headline ?? '',
    url: a.url ?? null,
    source: a.source ?? null,
    published_at: a.datetime ?? null,
    sentiment: 'neutral',
  }));

  // Tag sentiments with a single Claude call
  const tags = await tagSentiment(ticker.toUpperCase(), articles);
  for (const tag of tags) {
    if (articles[tag.index] && ['bullish', 'bearish', 'neutral'].includes(tag.sentiment)) {
      articles[tag.index].sentiment = tag.sentiment;
    }
  }

  const insert = db.prepare(`
    INSERT INTO news_cache (ticker, headline, url, source, published_at, sentiment, fetched_at)
    VALUES (@ticker, @headline, @url, @source, @published_at, @sentiment, unixepoch())
  `);
  db.transaction(items => { for (const item of items) insert.run(item); })(articles);

  return db.prepare(
    'SELECT * FROM news_cache WHERE ticker = ? ORDER BY published_at DESC LIMIT 10'
  ).all(ticker.toUpperCase());
}
