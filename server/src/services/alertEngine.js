import { getDb } from '../db/schema.js';

const CHECK_INTERVAL = 30_000;

function checkAlerts() {
  const db = getDb();
  const alerts = db.prepare("SELECT * FROM alerts WHERE triggered = 0 AND type IN ('above','below')").all();
  if (alerts.length === 0) return;

  const trigger = db.prepare(
    'UPDATE alerts SET triggered = 1, triggered_at = unixepoch() WHERE id = ?'
  );

  for (const alert of alerts) {
    const price = db.prepare('SELECT price FROM price_cache WHERE ticker = ?').get(alert.ticker);
    if (!price?.price || alert.target_price == null) continue;

    const hit =
      (alert.type === 'above' && price.price >= alert.target_price) ||
      (alert.type === 'below' && price.price <= alert.target_price);

    if (hit) {
      trigger.run(alert.id);
      console.log(`Alert triggered: ${alert.ticker} ${alert.type} $${alert.target_price} (current: $${price.price.toFixed(2)})`);
    }
  }
}

export function startAlertEngine() {
  setInterval(checkAlerts, CHECK_INTERVAL);
  console.log('Alert engine started (checking every 30s)');
}
