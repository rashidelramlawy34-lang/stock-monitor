// Integration test for portfolio CRUD — uses an in-memory DB override
import { strict as assert } from 'assert';
import { getDb } from '../src/db/schema.js';

test('getDb returns a database object', () => {
  const db = getDb();
  assert.ok(db, 'db should be truthy');
  assert.equal(typeof db.prepare, 'function', 'db.prepare should be a function');
});

test('holdings table exists', () => {
  const db = getDb();
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='holdings'").get();
  assert.ok(row, 'holdings table should exist');
});

test('can insert and retrieve a holding', () => {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO holdings (ticker, shares, cost_basis) VALUES ('TEST', 10, 100)").run();
  const row = db.prepare("SELECT * FROM holdings WHERE ticker='TEST'").get();
  assert.equal(row.shares, 10);
  db.prepare("DELETE FROM holdings WHERE ticker='TEST'").run();
});
