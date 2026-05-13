import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const DB_PATH = process.env.DB_PATH
  ? (process.env.DB_PATH.startsWith('/')
      ? process.env.DB_PATH  // absolute path (production)
      : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../', process.env.DB_PATH))
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../db/portfolio.db');

let db;

export function getDb() {
  if (!db) {
    mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    applySchema(db);
  }
  return db;
}

function applySchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT    PRIMARY KEY,
      email      TEXT,
      name       TEXT,
      avatar     TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS holdings (
      ticker        TEXT PRIMARY KEY,
      name          TEXT,
      shares        REAL    NOT NULL DEFAULT 0,
      cost_basis    REAL    NOT NULL DEFAULT 0,
      added_at      INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS price_cache (
      ticker        TEXT PRIMARY KEY,
      price         REAL,
      change_pct    REAL,
      volume        INTEGER,
      week_52_high  REAL,
      week_52_low   REAL,
      market_cap    REAL,
      fetched_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS news_cache (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker        TEXT    NOT NULL,
      headline      TEXT    NOT NULL,
      url           TEXT,
      source        TEXT,
      published_at  INTEGER,
      sentiment     TEXT    CHECK(sentiment IN ('bullish','bearish','neutral')),
      summary       TEXT,
      fetched_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_news_ticker ON news_cache(ticker);
    CREATE INDEX IF NOT EXISTS idx_news_fetched ON news_cache(fetched_at);

    CREATE TABLE IF NOT EXISTS ai_advice (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker        TEXT    NOT NULL,
      recommendation TEXT   CHECK(recommendation IN ('buy','hold','sell')),
      reasoning     TEXT,
      confidence    REAL,
      generated_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_advice_ticker ON ai_advice(ticker);

    CREATE TABLE IF NOT EXISTS alerts (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker        TEXT    NOT NULL,
      type          TEXT    NOT NULL CHECK(type IN ('above','below','sentiment_shift')),
      target_price  REAL,
      triggered     INTEGER NOT NULL DEFAULT 0,
      triggered_at  INTEGER,
      created_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_ticker ON alerts(ticker);

    CREATE TABLE IF NOT EXISTS fundamentals_cache (
      ticker              TEXT PRIMARY KEY,
      sector              TEXT,
      industry            TEXT,
      company_name        TEXT,
      logo_url            TEXT,
      web_url             TEXT,
      beta                REAL,
      pe_ratio            REAL,
      ps_ratio            REAL,
      pb_ratio            REAL,
      eps_growth          REAL,
      revenue_growth      REAL,
      roe                 REAL,
      debt_equity         REAL,
      dividend_yield      REAL,
      strong_buy          INTEGER,
      buy_count           INTEGER,
      hold_count          INTEGER,
      sell_count          INTEGER,
      strong_sell         INTEGER,
      target_high         REAL,
      target_low          REAL,
      target_mean         REAL,
      target_median       REAL,
      next_earnings_date  TEXT,
      next_earnings_estimate REAL,
      fetched_at          INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS candles_cache (
      ticker      TEXT PRIMARY KEY,
      closes      TEXT,
      timestamps  TEXT,
      fetched_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS hrhr_cache (
      id           INTEGER PRIMARY KEY,
      results      TEXT NOT NULL,
      generated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker     TEXT    NOT NULL,
      price      REAL    NOT NULL,
      recorded_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_ph_ticker_ts ON price_history(ticker, recorded_at);

    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS watchlist (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id  TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticker   TEXT    NOT NULL,
      note     TEXT,
      added_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(user_id, ticker)
    );

    CREATE TABLE IF NOT EXISTS trades (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticker     TEXT    NOT NULL,
      action     TEXT    NOT NULL CHECK(action IN ('buy','sell')),
      shares     REAL    NOT NULL,
      price      REAL    NOT NULL,
      fees       REAL    NOT NULL DEFAULT 0,
      traded_at  INTEGER NOT NULL DEFAULT (unixepoch()),
      note       TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id, ticker);

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint   TEXT    NOT NULL UNIQUE,
      p256dh     TEXT    NOT NULL,
      auth       TEXT    NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS coach_cache (
      user_id      TEXT    PRIMARY KEY,
      analysis     TEXT    NOT NULL,
      generated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS portfolios (
      id         TEXT    PRIMARY KEY,
      user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT    NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS market_data_cache (
      type       TEXT    NOT NULL,
      ticker     TEXT    NOT NULL DEFAULT '',
      data       TEXT    NOT NULL,
      fetched_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (type, ticker)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS coach_score_history (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score        INTEGER NOT NULL,
      health       TEXT,
      generated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_coach_history_user ON coach_score_history(user_id, generated_at);
  `);

  // Add new columns if they don't exist yet
  const newCols = [
    'ALTER TABLE users ADD COLUMN password_hash TEXT',
    'ALTER TABLE ai_advice ADD COLUMN bull_case TEXT',
    'ALTER TABLE ai_advice ADD COLUMN bear_case TEXT',
    'ALTER TABLE ai_advice ADD COLUMN price_target REAL',
    'ALTER TABLE ai_advice ADD COLUMN stop_loss REAL',
    'ALTER TABLE ai_advice ADD COLUMN key_risks TEXT',
    'ALTER TABLE ai_advice ADD COLUMN key_catalysts TEXT',
    // User-scoping columns
    "ALTER TABLE holdings ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default'",
    "ALTER TABLE alerts ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default'",
    "ALTER TABLE ai_advice ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default'",
    // Portfolio columns
    'ALTER TABLE holdings ADD COLUMN portfolio_id TEXT',
    'ALTER TABLE alerts   ADD COLUMN portfolio_id TEXT',
    'ALTER TABLE trades   ADD COLUMN portfolio_id TEXT',
    // Email alert columns
    'ALTER TABLE users ADD COLUMN email_alerts_enabled INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE users ADD COLUMN alert_email TEXT',
    // Alert enhancements
    'ALTER TABLE alerts ADD COLUMN snoozed_until INTEGER',
    'ALTER TABLE alerts ADD COLUMN trigger_pct REAL',
    'ALTER TABLE users ADD COLUMN mobile_token TEXT',
  ];
  for (const sql of newCols) { try { db.exec(sql); } catch {} }

  // Earlier local builds keyed holdings by ticker only. Re-key by user+ticker so
  // accounts can save the same symbol without replacing each other's holdings.
  try {
    const columns = db.prepare('PRAGMA table_info(holdings)').all();
    const primaryColumns = columns.filter(col => col.pk > 0).sort((a, b) => a.pk - b.pk).map(col => col.name);
    const needsScopedHoldings = primaryColumns.length === 1 && primaryColumns[0] === 'ticker';
    if (needsScopedHoldings) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS holdings_next (
          ticker       TEXT    NOT NULL,
          name         TEXT,
          shares       REAL    NOT NULL DEFAULT 0,
          cost_basis   REAL    NOT NULL DEFAULT 0,
          added_at     INTEGER NOT NULL DEFAULT (unixepoch()),
          user_id      TEXT    NOT NULL DEFAULT 'default',
          portfolio_id TEXT,
          PRIMARY KEY (user_id, ticker)
        );
      `);
      db.exec(`
        INSERT OR REPLACE INTO holdings_next (ticker, name, shares, cost_basis, added_at, user_id, portfolio_id)
        SELECT ticker, name, shares, cost_basis, added_at, user_id, portfolio_id FROM holdings;
        DROP TABLE holdings;
        ALTER TABLE holdings_next RENAME TO holdings;
      `);
    }
  } catch {}

  // Portfolio migration: every account gets a Default portfolio, and old rows
  // with null portfolio_id are attached to it.
  try {
    const users = db.prepare('SELECT id FROM users').all();
    const usersWithRows = db.prepare(`
      SELECT DISTINCT user_id AS id FROM holdings
      UNION
      SELECT DISTINCT user_id AS id FROM alerts
      UNION
      SELECT DISTINCT user_id AS id FROM trades
    `).all();
    const userIds = [...new Set([...users, ...usersWithRows].map(row => row.id).filter(Boolean))];

    for (const userId of userIds) {
      let portfolio = db
        .prepare('SELECT * FROM portfolios WHERE user_id = ? AND is_default = 1 ORDER BY created_at ASC LIMIT 1')
        .get(userId);
      if (!portfolio) {
        portfolio = db
          .prepare('SELECT * FROM portfolios WHERE user_id = ? ORDER BY created_at ASC LIMIT 1')
          .get(userId);
        if (portfolio) {
          db.prepare('UPDATE portfolios SET is_default = 0 WHERE user_id = ?').run(userId);
          db.prepare('UPDATE portfolios SET is_default = 1 WHERE id = ?').run(portfolio.id);
        } else {
          const id = randomUUID();
          db.prepare(`INSERT OR IGNORE INTO portfolios (id, user_id, name, is_default) VALUES (?, ?, 'Default', 1)`).run(id, userId);
          portfolio = { id };
        }
      }

      db.prepare(`UPDATE holdings SET portfolio_id = ? WHERE user_id = ? AND portfolio_id IS NULL`).run(portfolio.id, userId);
      db.prepare(`UPDATE alerts SET portfolio_id = ? WHERE user_id = ? AND portfolio_id IS NULL`).run(portfolio.id, userId);
      db.prepare(`UPDATE trades SET portfolio_id = ? WHERE user_id = ? AND portfolio_id IS NULL`).run(portfolio.id, userId);
    }
  } catch {}
}
