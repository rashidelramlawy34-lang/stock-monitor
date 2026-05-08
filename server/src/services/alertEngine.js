import webpush from 'web-push';
import { getDb } from '../db/schema.js';
import { sendAlertEmail } from './emailService.js';

const CHECK_INTERVAL = 30_000;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@stockmonitor.app'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

async function sendPushToUser(userId, payload) {
  if (!process.env.VAPID_PUBLIC_KEY) return;
  const db = getDb();
  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId);
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
    } catch (e) {
      if (e.statusCode === 410 || e.statusCode === 404) {
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
      }
    }
  }
}

function checkAlerts() {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const alerts = db.prepare(
    "SELECT * FROM alerts WHERE triggered = 0 AND (snoozed_until IS NULL OR snoozed_until < ?) AND type IN ('above','below','pct_drop','pct_rise')"
  ).all(now);
  if (alerts.length === 0) return;

  const trigger = db.prepare(
    'UPDATE alerts SET triggered = 1, triggered_at = unixepoch() WHERE id = ?'
  );

  for (const alert of alerts) {
    const priceRow = db.prepare('SELECT price FROM price_cache WHERE ticker = ?').get(alert.ticker);
    if (!priceRow?.price) continue;
    const price = priceRow.price;

    let hit = false;
    if (alert.type === 'above' && alert.target_price != null) hit = price >= alert.target_price;
    else if (alert.type === 'below' && alert.target_price != null) hit = price <= alert.target_price;
    else if (alert.type === 'pct_drop' && alert.trigger_pct != null) {
      const holdingRow = db.prepare('SELECT cost_basis FROM holdings WHERE ticker = ? AND user_id = ?').get(alert.ticker, alert.user_id);
      if (holdingRow?.cost_basis) hit = ((price - holdingRow.cost_basis) / holdingRow.cost_basis * 100) <= -Math.abs(alert.trigger_pct);
    } else if (alert.type === 'pct_rise' && alert.trigger_pct != null) {
      const holdingRow = db.prepare('SELECT cost_basis FROM holdings WHERE ticker = ? AND user_id = ?').get(alert.ticker, alert.user_id);
      if (holdingRow?.cost_basis) hit = ((price - holdingRow.cost_basis) / holdingRow.cost_basis * 100) >= Math.abs(alert.trigger_pct);
    }

    if (hit) {
      trigger.run(alert.id);
      console.log(`Alert triggered: ${alert.ticker} ${alert.type} $${alert.target_price} (current: $${price.price.toFixed(2)})`);

      const direction = alert.type === 'above' ? '↑ above' : '↓ below';
      sendPushToUser(alert.user_id, {
        title: `Alert: ${alert.ticker} ${direction} $${alert.target_price}`,
        body: `Current price: $${price.toFixed(2)}`,
      }).catch(() => {});

      const userRow = db.prepare('SELECT alert_email, email_alerts_enabled FROM users WHERE id = ?').get(alert.user_id);
      if (userRow?.email_alerts_enabled && userRow.alert_email) {
        sendAlertEmail({
          toEmail: userRow.alert_email,
          ticker: alert.ticker,
          type: alert.type,
          targetPrice: alert.target_price,
          currentPrice: price.toFixed(2),
        }).catch(() => {});
      }
    }
  }
}

export function startAlertEngine() {
  setInterval(checkAlerts, CHECK_INTERVAL);
  console.log('Alert engine started (checking every 30s)');
}
