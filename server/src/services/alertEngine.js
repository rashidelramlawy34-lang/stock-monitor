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

      const direction = alert.type === 'above' ? '↑ above' : '↓ below';
      sendPushToUser(alert.user_id, {
        title: `Alert: ${alert.ticker} ${direction} $${alert.target_price}`,
        body: `Current price: $${price.price.toFixed(2)}`,
      }).catch(() => {});

      const userRow = db.prepare('SELECT alert_email, email_alerts_enabled FROM users WHERE id = ?').get(alert.user_id);
      if (userRow?.email_alerts_enabled && userRow.alert_email) {
        sendAlertEmail({
          toEmail: userRow.alert_email,
          ticker: alert.ticker,
          type: alert.type,
          targetPrice: alert.target_price,
          currentPrice: price.price.toFixed(2),
        }).catch(() => {});
      }
    }
  }
}

export function startAlertEngine() {
  setInterval(checkAlerts, CHECK_INTERVAL);
  console.log('Alert engine started (checking every 30s)');
}
