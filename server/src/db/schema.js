import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
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
  `);

  // Add new columns to ai_advice if they don't exist yet
  const newCols = [
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
  ];
  for (const sql of newCols) { try { db.exec(sql); } catch {} }
}
