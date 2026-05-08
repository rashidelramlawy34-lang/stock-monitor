import { getDb } from '../db/schema.js';
import { getSetting } from './settingsService.js';

const BASE = 'https://finnhub.io/api/v1';
const CACHE_TTL = 12 * 60 * 60; // 12 hours

function apiKey() {
  const key = getSetting('FINNHUB_API_KEY');
  if (!key) throw new Error('Finnhub API key not set.');
  return key;
}

async function finnhubGet(path) {
  const url = `${BASE}${path}&token=${apiKey()}`;
  const res = await fetch(url);
  if (res.status === 429) throw new Error('Finnhub rate limit');
  if (!res.ok) return null;
  return res.json();
}

function getCached(type, ticker = '') {
  const db = getDb();
  const row = db.prepare(
    'SELECT data, fetched_at FROM market_data_cache WHERE type = ? AND ticker = ?'
  ).get(type, ticker);
  if (!row) return null;
  if (Math.floor(Date.now() / 1000) - row.fetched_at > CACHE_TTL) return null;
  try { return JSON.parse(row.data); } catch { return null; }
}

function setCache(type, ticker = '', data) {
  getDb().prepare(`
    INSERT INTO market_data_cache (type, ticker, data, fetched_at)
    VALUES (?, ?, ?, unixepoch())
    ON CONFLICT(type, ticker) DO UPDATE SET data = excluded.data, fetched_at = excluded.fetched_at
  `).run(type, ticker, JSON.stringify(data));
}

export async function fetchShortInterest(ticker) {
  const sym = ticker.toUpperCase();
  const cached = getCached('short_interest', sym);
  if (cached) return cached;

  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const data = await finnhubGet(`/stock/short-interest?symbol=${sym}&from=${from}&to=${today}`);
  const result = data?.data?.[0] ?? null;
  setCache('short_interest', sym, result);
  return result;
}

export async function fetchInsiders(ticker) {
  const sym = ticker.toUpperCase();
  const cached = getCached('insider', sym);
  if (cached) return cached;

  const data = await finnhubGet(`/stock/insider-transactions?symbol=${sym}`);
  const result = (data?.data ?? []).slice(0, 20);
  setCache('insider', sym, result);
  return result;
}

export async function fetchInstitutional(ticker) {
  const sym = ticker.toUpperCase();
  const cached = getCached('institutional', sym);
  if (cached) return cached;

  const data = await finnhubGet(`/stock/ownership?symbol=${sym}&limit=5`);
  const result = data?.ownership ?? [];
  setCache('institutional', sym, result);
  return result;
}

export async function fetchDividends(ticker) {
  const sym = ticker.toUpperCase();
  const cached = getCached('dividends', sym);
  if (cached) return cached;

  const from = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);
  const data = await finnhubGet(`/stock/dividends2?symbol=${sym}`);
  const result = Array.isArray(data) ? data.slice(0, 8) : [];
  setCache('dividends', sym, result);
  return result;
}

export async function fetchUpgradesDowngrades(ticker) {
  const sym = ticker.toUpperCase();
  const cached = getCached('upgrades', sym);
  if (cached) return cached;

  const data = await finnhubGet(`/stock/upgrade-downgrade?symbol=${sym}`);
  const result = Array.isArray(data) ? data.slice(0, 10) : [];
  setCache('upgrades', sym, result);
  return result;
}

export async function fetchEconomicCalendar() {
  const cached = getCached('economic_calendar', '');
  if (cached) return cached;

  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const data = await finnhubGet(`/calendar/economic?from=${from}&to=${to}`);
  const result = data?.economicCalendar ?? [];
  setCache('economic_calendar', '', result);
  return result;
}
