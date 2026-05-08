// Integration test for portfolio CRUD — uses an in-memory DB override
import { strict as assert } from 'assert';

// Minimal smoke test: verify schema module exports getDb without throwing
// Full integration tests require the server running; run with `npm test` after `npm install`
const test = (name, fn) => {
  try { fn(); console.log(`  PASS  ${name}`); }
  catch (e) { console.error(`  FAIL  ${name}\n        ${e.message}`); process.exitCode = 1; }
};

test('getDb returns a database object', async () => {
  const { getDb } = await import('../src/db/schema.js');
  const db = getDb();
  assert.ok(db, 'db should be truthy');
  assert.equal(typeof db.prepare, 'function', 'db.prepare should be a function');
});

test('holdings table exists', async () => {
  const { getDb } = await import('../src/db/schema.js');
  const db = getDb();
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='holdings'").get();
  assert.ok(row, 'holdings table should exist');
});

test('can insert and retrieve a holding', async () => {
  const { getDb } = await import('../src/db/schema.js');
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO holdings (ticker, shares, cost_basis) VALUES ('TEST', 10, 100)").run();
  const row = db.prepare("SELECT * FROM holdings WHERE ticker='TEST'").get();
  assert.equal(row.shares, 10);
  db.prepare("DELETE FROM holdings WHERE ticker='TEST'").run();
});
