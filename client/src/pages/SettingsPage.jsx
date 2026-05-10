import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePushNotifications } from '../hooks/usePushNotifications.js';

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 18, delay: i * 0.07 },
  }),
};

function SectionHeader({ title, description }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{title}</h2>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{description}</p>
    </div>
  );
}

function EmailAlertsSection({ index }) {
  const [settings, setSettings] = useState({ alert_email: '', email_alerts_enabled: 0 });
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch('/auth/me/settings', { credentials: 'include' })
      .then(r => r.ok ? r.json() : {})
      .then(d => setSettings(d))
      .catch(() => {});
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/auth/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { user } = await res.json();
      setSettings(user);
      setDraft({});
      setMsg('Saved');
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  const current = { ...settings, ...draft };

  return (
    <motion.form onSubmit={save} custom={index} variants={sectionVariants} initial="hidden" animate="visible"
      className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Email alerts" description="Receive an email when a price alert fires. Requires a SendGrid API key above." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Alert email address</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={current.alert_email ?? ''}
          onChange={e => setDraft(d => ({ ...d, alert_email: e.target.value }))}
          className="input"
          style={{ width: '100%' }}
        />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={!!current.email_alerts_enabled}
          onChange={e => setDraft(d => ({ ...d, email_alerts_enabled: e.target.checked ? 1 : 0 }))}
          style={{ width: 14, height: 14, accentColor: 'var(--accent)' }}
        />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>Enable email alerts</span>
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="submit" disabled={saving || !Object.keys(draft).length} className="btn-primary">
          {saving ? 'Saving…' : 'Save email settings'}
        </button>
        {msg && <span style={{ fontSize: 'var(--text-xs)', color: msg.startsWith('Error') ? 'var(--loss)' : 'var(--gain)' }}>{msg}</span>}
      </div>
    </motion.form>
  );
}

function KeyField({ label, keyName, description, current, onChange }) {
  const [show, setShow] = useState(false);
  const isSet = current === '***set***';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{label}</label>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: -2 }}>{description}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type={show ? 'text' : 'password'}
            placeholder={isSet ? '••••••••••••••••••••••••' : 'Paste your key here…'}
            onChange={e => onChange(keyName, e.target.value)}
            className="input font-mono"
            style={{ width: '100%', paddingRight: 52, fontSize: 'var(--text-xs)' }}
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        <span style={{
          fontSize: 'var(--text-xs)', fontWeight: 600, padding: '4px 10px',
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
          background: isSet ? 'var(--gain-soft)' : 'var(--surface-2)',
          color: isSet ? 'var(--gain)' : 'var(--text-muted)',
        }}>
          {isSet ? '✓ Set' : 'Not set'}
        </span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const push = usePushNotifications();
  const [saved, setSaved] = useState({});
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => setSaved(d))
      .catch(() => {});
  }, []);

  const handleChange = (key, value) => {
    setDraft(d => ({ ...d, [key]: value }));
    setSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await fetch('/api/settings').then(r => r.json());
      setSaved(updated);
      setDraft({});
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasDraft = Object.keys(draft).some(k => draft[k] !== '');

  return (
    <div className="page">
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">API keys are stored locally and never leave your machine.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AI Keys */}
          <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible"
            className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SectionHeader title="AI analysis" description="Powers the AI Advisor, Portfolio Digest, and Discover scan." />
            <KeyField
              label="Anthropic API key"
              keyName="ANTHROPIC_API_KEY"
              description="Get your key at console.anthropic.com → API Keys"
              current={saved['ANTHROPIC_API_KEY'] ?? ''}
              onChange={handleChange}
            />
          </motion.div>

          {/* Market Data Keys */}
          <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible"
            className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SectionHeader title="Market data" description="Required for live prices, fundamentals, and news. Free tier at finnhub.io." />
            <KeyField
              label="Finnhub API key"
              keyName="FINNHUB_API_KEY"
              description="Get your free key at finnhub.io → Dashboard"
              current={saved['FINNHUB_API_KEY'] ?? ''}
              onChange={handleChange}
            />
            <KeyField
              label="SendGrid API key"
              keyName="SENDGRID_API_KEY"
              description="For email price alerts. Get a free key at sendgrid.com → API Keys."
              current={saved['SENDGRID_API_KEY'] ?? ''}
              onChange={handleChange}
            />
            <KeyField
              label="Alert from email"
              keyName="ALERT_FROM_EMAIL"
              description="The sender address for alert emails (must be verified in SendGrid)."
              current={saved['ALERT_FROM_EMAIL'] ?? ''}
              onChange={handleChange}
            />
          </motion.div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="submit" disabled={saving || !hasDraft} className="btn-primary">
              {saving ? 'Saving…' : 'Save keys'}
            </button>
            {success && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gain)', fontWeight: 600 }}>✓ Keys saved</span>}
            {error && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--loss)' }}>{error}</span>}
          </div>
        </form>

        <EmailAlertsSection index={2} />

        {/* Push Notifications */}
        <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible"
          className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionHeader title="Push notifications" description="Get browser notifications when your price alerts fire." />
          {!push.supported && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Push notifications are not supported in this browser.</p>
          )}
          {push.supported && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Status:{' '}
                  <span style={{ fontWeight: 600, color: push.permission === 'granted' ? 'var(--gain)' : push.permission === 'denied' ? 'var(--loss)' : 'var(--text-muted)' }}>
                    {push.permission === 'granted' ? 'Allowed' : push.permission === 'denied' ? 'Blocked' : 'Not set'}
                  </span>
                  {push.subscribed && <span style={{ color: 'var(--gain)', marginLeft: 8 }}>· Subscribed</span>}
                </p>
                {push.error && <p style={{ color: 'var(--loss)', fontSize: 'var(--text-xs)', marginTop: 4 }}>{push.error}</p>}
              </div>
              {push.subscribed ? (
                <button onClick={push.unsubscribe} disabled={push.loading} className="btn-outline">
                  {push.loading ? 'Disabling…' : 'Disable notifications'}
                </button>
              ) : (
                <button onClick={push.subscribe} disabled={push.loading || push.permission === 'denied'} className="btn-primary">
                  {push.loading ? 'Enabling…' : 'Enable notifications'}
                </button>
              )}
            </div>
          )}
          {push.permission === 'denied' && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--warn)' }}>Notifications are blocked. Allow them in your browser settings, then try again.</p>
          )}
        </motion.div>

        {/* Info */}
        <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible"
          className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>How keys are used</p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
            {[
              ['Anthropic', 'AI Advisor analysis, Portfolio Digest, and Discover deep analysis'],
              ['Finnhub', 'Real-time prices, fundamentals, analyst ratings, earnings calendar, and news'],
              [null, 'Keys set via environment variables take precedence over keys saved here'],
              [null, 'Keys are only used server-side — never sent to the browser'],
            ].map(([key, desc], i) => (
              <li key={i} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', listStyleType: 'disc' }}>
                {key && <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{key}</span>}{key ? ' — ' : ''}{desc}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
