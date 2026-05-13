import { scryptSync, randomBytes } from 'crypto';
import { getDb } from './schema.js';

export const DEMO_USER_ID = 'demo';
export const DEMO_PASSWORD = 'demo';
export const DEMO_PORTFOLIO_ID = 'demo-default-portfolio';

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function daysAgo(n) {
  return Math.floor(Date.now() / 1000) - n * 86400;
}

const HOLDINGS = [
  { ticker: 'AAPL', shares: 25, cost_basis: 145.5, price: 193.39, change_pct: -0.36 },
  { ticker: 'MSFT', shares: 15, cost_basis: 312, price: 433.78, change_pct: 1.27 },
  { ticker: 'NVDA', shares: 20, cost_basis: 280.4, price: 936.42, change_pct: 4.08 },
  { ticker: 'GOOGL', shares: 10, cost_basis: 138.2, price: 171.15, change_pct: 0.84 },
  { ticker: 'AMZN', shares: 8, cost_basis: 142.8, price: 188.74, change_pct: 1.62 },
  { ticker: 'TSLA', shares: 12, cost_basis: 220.1, price: 219.2, change_pct: -2.61 },
  { ticker: 'META', shares: 6, cost_basis: 295.5, price: 512.33, change_pct: 1.92 },
  { ticker: 'JPM', shares: 30, cost_basis: 145, price: 201.48, change_pct: 0.47 },
  { ticker: 'V', shares: 18, cost_basis: 230.75, price: 278.64, change_pct: 0.35 },
  { ticker: 'BRK.B', shares: 12, cost_basis: 360.2, price: 421.7, change_pct: 0.18 },
];

const WATCHLIST = [
  { ticker: 'SPY', note: 'Market benchmark', price: 529.57, change_pct: 0.93 },
  { ticker: 'QQQ', note: 'Growth benchmark', price: 454.12, change_pct: 1.14 },
  { ticker: 'ARKK', note: 'High beta innovation', price: 47.22, change_pct: 2.08 },
  { ticker: 'COIN', note: 'Crypto beta', price: 236.81, change_pct: 3.41 },
  { ticker: 'AMD', note: 'AI semiconductor peer', price: 164.2, change_pct: 2.16 },
  { ticker: 'NFLX', note: 'Streaming momentum', price: 641.18, change_pct: -0.72 },
  { ticker: 'DIS', note: 'Turnaround watch', price: 113.08, change_pct: 0.39 },
  { ticker: 'UBER', note: 'Platform compounder', price: 72.46, change_pct: 1.01 },
];

const ALERTS = [
  { ticker: 'AAPL', type: 'above', target_price: 200, trigger_pct: null },
  { ticker: 'TSLA', type: 'below', target_price: 180, trigger_pct: null },
  { ticker: 'NVDA', type: 'above', target_price: 975, trigger_pct: null },
  { ticker: 'AMZN', type: 'below', target_price: 170, trigger_pct: null },
  { ticker: 'MSFT', type: 'above', target_price: 450, trigger_pct: null },
];

const TRADES = [
  { ticker: 'AAPL', action: 'buy', shares: 25, price: 145.5, fees: 0, traded_at: daysAgo(165), note: 'Core quality compounder' },
  { ticker: 'MSFT', action: 'buy', shares: 15, price: 312, fees: 0, traded_at: daysAgo(150), note: 'AI/cloud exposure' },
  { ticker: 'NVDA', action: 'buy', shares: 25, price: 265, fees: 0, traded_at: daysAgo(140), note: 'Accelerated compute thesis' },
  { ticker: 'GOOGL', action: 'buy', shares: 10, price: 138.2, fees: 0, traded_at: daysAgo(130), note: 'Search plus AI optionality' },
  { ticker: 'TSLA', action: 'buy', shares: 20, price: 215, fees: 0, traded_at: daysAgo(120), note: 'Volatile satellite position' },
  { ticker: 'TSLA', action: 'sell', shares: 8, price: 242, fees: 0, traded_at: daysAgo(95), note: 'Took partial profits' },
  { ticker: 'NVDA', action: 'sell', shares: 5, price: 310, fees: 0, traded_at: daysAgo(80), note: 'Rebalanced after rally' },
  { ticker: 'AMZN', action: 'buy', shares: 8, price: 142.8, fees: 0, traded_at: daysAgo(75), note: 'Retail margin recovery' },
  { ticker: 'META', action: 'buy', shares: 6, price: 295.5, fees: 0, traded_at: daysAgo(60), note: 'Ad cycle strength' },
  { ticker: 'JPM', action: 'buy', shares: 30, price: 145, fees: 0, traded_at: daysAgo(45), note: 'Financials ballast' },
  { ticker: 'V', action: 'buy', shares: 18, price: 230.75, fees: 0, traded_at: daysAgo(30), note: 'Payments quality' },
  { ticker: 'BRK.B', action: 'buy', shares: 12, price: 360.2, fees: 0, traded_at: daysAgo(15), note: 'Defensive equity sleeve' },
];

function seedPriceCache(db) {
  const priceStmt = db.prepare(`
    INSERT OR REPLACE INTO price_cache
      (ticker, price, change_pct, volume, week_52_high, week_52_low, market_cap, fetched_at)
    VALUES
      (@ticker, @price, @change_pct, @volume, @week_52_high, @week_52_low, @market_cap, unixepoch())
  `);
  const historyStmt = db.prepare('INSERT INTO price_history (ticker, price, recorded_at) VALUES (?, ?, ?)');
  const allPrices = [...HOLDINGS, ...WATCHLIST];
  const now = Math.floor(Date.now() / 1000);

  for (const item of allPrices) {
    priceStmt.run({
      ticker: item.ticker,
      price: item.price,
      change_pct: item.change_pct,
      volume: 1_000_000,
      week_52_high: item.price * 1.18,
      week_52_low: item.price * 0.72,
      market_cap: null,
    });

    for (let i = 23; i >= 0; i -= 1) {
      const drift = 1 + (Math.sin(i / 2) * 0.012) - (i * 0.0025);
      historyStmt.run(item.ticker, +(item.price * drift).toFixed(2), now - i * 3600);
    }
  }
}

export function ensureDemoAccount({ reset = false } = {}) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(DEMO_USER_ID);
  const holdingCount = db.prepare('SELECT COUNT(*) AS c FROM holdings WHERE user_id = ?').get(DEMO_USER_ID).c;

  if (existing && holdingCount >= HOLDINGS.length && !reset) {
    seedPriceCache(db);
    return { created: false, user: { id: DEMO_USER_ID, name: 'Demo User' } };
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM trades WHERE user_id = ?').run(DEMO_USER_ID);
    db.prepare('DELETE FROM alerts WHERE user_id = ?').run(DEMO_USER_ID);
    db.prepare('DELETE FROM watchlist WHERE user_id = ?').run(DEMO_USER_ID);
    db.prepare('DELETE FROM holdings WHERE user_id = ?').run(DEMO_USER_ID);
    db.prepare('DELETE FROM portfolios WHERE user_id = ?').run(DEMO_USER_ID);
    db.prepare('DELETE FROM users WHERE id = ?').run(DEMO_USER_ID);

    db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)')
      .run(DEMO_USER_ID, 'Demo User', 'demo@example.com', hashPassword(DEMO_PASSWORD));

    db.prepare('INSERT INTO portfolios (id, user_id, name, is_default) VALUES (?, ?, ?, ?)')
      .run(DEMO_PORTFOLIO_ID, DEMO_USER_ID, 'Aura Demo Portfolio', 1);

    const holdingStmt = db.prepare(`
      INSERT OR REPLACE INTO holdings (ticker, shares, cost_basis, user_id, portfolio_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const h of HOLDINGS) {
      holdingStmt.run(h.ticker, h.shares, h.cost_basis, DEMO_USER_ID, DEMO_PORTFOLIO_ID);
    }

    const wlStmt = db.prepare('INSERT INTO watchlist (user_id, ticker, note) VALUES (?, ?, ?)');
    for (const item of WATCHLIST) wlStmt.run(DEMO_USER_ID, item.ticker, item.note);

    const alertStmt = db.prepare(`
      INSERT INTO alerts (ticker, type, target_price, trigger_pct, user_id, portfolio_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const a of ALERTS) {
      alertStmt.run(a.ticker, a.type, a.target_price, a.trigger_pct, DEMO_USER_ID, DEMO_PORTFOLIO_ID);
    }

    const tradeStmt = db.prepare(`
      INSERT INTO trades (user_id, ticker, action, shares, price, fees, traded_at, note, portfolio_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of TRADES) {
      tradeStmt.run(DEMO_USER_ID, t.ticker, t.action, t.shares, t.price, t.fees, t.traded_at, t.note, DEMO_PORTFOLIO_ID);
    }

    seedPriceCache(db);
  });

  tx();

  return { created: true, user: { id: DEMO_USER_ID, name: 'Demo User' } };
}
