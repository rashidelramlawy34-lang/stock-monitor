import sgMail from '@sendgrid/mail';
import { getSetting } from './settingsService.js';

export async function sendAlertEmail({ toEmail, ticker, type, targetPrice, currentPrice }) {
  const key = getSetting('SENDGRID_API_KEY');
  if (!key || !toEmail) return;

  sgMail.setApiKey(key);
  const fromEmail = getSetting('ALERT_FROM_EMAIL') || 'alerts@stockmonitor.app';
  const direction = type === 'above' ? 'risen above' : 'fallen below';
  const arrow = type === 'above' ? '↑' : '↓';

  await sgMail.send({
    to: toEmail,
    from: fromEmail,
    subject: `S.M.I. Alert: ${ticker} ${arrow} $${targetPrice}`,
    text: `${ticker} has ${direction} $${targetPrice}. Current price: $${currentPrice}`,
    html: `
      <div style="font-family:monospace;background:#020810;color:#00d4ff;padding:24px;border:1px solid rgba(0,212,255,0.3);border-radius:4px;max-width:480px">
        <h2 style="margin:0 0 12px;font-size:16px;letter-spacing:0.2em;text-transform:uppercase">S.M.I. Price Alert</h2>
        <p style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#fff">${ticker} ${arrow}</p>
        <p style="margin:0 0 4px;color:rgba(0,212,255,0.7)">Has ${direction} <strong style="color:#fff">$${targetPrice}</strong></p>
        <p style="margin:0 0 16px;color:rgba(0,212,255,0.5)">Current price: <strong style="color:#00e676">$${currentPrice}</strong></p>
        <hr style="border-color:rgba(0,212,255,0.15);margin:16px 0"/>
        <p style="margin:0;font-size:10px;color:rgba(0,212,255,0.3);letter-spacing:0.1em">STARK MARKET INTELLIGENCE · JARVIS v2.1</p>
      </div>
    `,
  });
}
