import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlerts } from '../hooks/useAlerts.js';
import { usePortfolio } from '../hooks/usePortfolio.js';
import { SkeletonPage } from '../components/Skeleton.jsx';

const PRICE_TYPES = ['above', 'below'];
const PCT_TYPES   = ['pct_rise', 'pct_drop'];

function typeLabel(type) {
  if (type === 'above')    return '↑ Above';
  if (type === 'below')    return '↓ Below';
  if (type === 'pct_rise') return '↑ % Rise';
  if (type === 'pct_drop') return '↓ % Drop';
  return type;
}

function StatusBadge({ alert }) {
  const isSnoozed = alert.snoozed_until && alert.snoozed_until > Date.now() / 1000;
  const snoozeRemain = isSnoozed ? Math.ceil((alert.snoozed_until - Date.now() / 1000) / 3600) : 0;
  if (isSnoozed)
    return <span className="badge-neutral">Snoozed {snoozeRemain}h</span>;
  if (alert.triggered)
    return <span className="badge-bear">Triggered</span>;
  return <span className="badge-neutral">Watching</span>;
}

function AlertRow({ alert, onDelete, onSnooze, onReset, index }) {
  const isPct = PCT_TYPES.includes(alert.type);
  const isSnoozed = alert.snoozed_until && alert.snoozed_until > Date.now() / 1000;
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18, delay: index * 0.04 }}
      className="table-row-hover"
    >
      <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)', fontSize: 'var(--text-sm)' }}>
        {alert.ticker}
      </td>
      <td style={{ padding: '14px 20px', fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>
        {typeLabel(alert.type)}
      </td>
      <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>
        {isPct ? `${alert.trigger_pct}%` : alert.target_price != null ? `$${Number(alert.target_price).toFixed(2)}` : '—'}
      </td>
      <td style={{ padding: '14px 20px' }}>
        <StatusBadge alert={alert} />
      </td>
      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          {alert.triggered && !isSnoozed && (
            <button onClick={() => onSnooze(alert.id, 24)} className="btn-ghost" style={{ fontSize: 'var(--text-xs)', color: 'var(--warn)' }}>
              Snooze 24h
            </button>
          )}
          {(alert.triggered || isSnoozed) && (
            <button onClick={() => onReset(alert.id)} className="btn-ghost" style={{ fontSize: 'var(--text-xs)' }}>
              Reset
            </button>
          )}
          <button onClick={() => onDelete(alert.id)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, transition: 'color 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--loss)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            ✕
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

export default function AlertsPage() {
  const { active, triggered, snoozed, loading, addAlert, deleteAlert, snoozeAlert, resetAlert } = useAlerts();
  const { holdings } = usePortfolio();
  const [tab, setTab] = useState('active');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ticker: '', type: 'above', target_price: '', trigger_pct: '' });
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const isPctType = PCT_TYPES.includes(form.type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.ticker) return setFormError('Select a ticker');
    if (isPctType && (!form.trigger_pct || Number(form.trigger_pct) <= 0)) return setFormError('Enter a valid percentage');
    if (!isPctType && (!form.target_price || Number(form.target_price) <= 0)) return setFormError('Enter a valid price');
    setBusy(true);
    try {
      await addAlert(form);
      setForm(f => ({ ...f, target_price: '', trigger_pct: '' }));
      setShowCreate(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <SkeletonPage cards={3} />;

  const tabRows = tab === 'active' ? active : [...triggered, ...snoozed];

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">Get notified when prices hit your targets</p>
        </div>
        <button onClick={() => setShowCreate(v => !v)} className="btn-primary">
          {showCreate ? 'Cancel' : '+ Create alert'}
        </button>
      </div>

      {/* Stat strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}
      >
        {[
          { label: 'Active',    value: active.length },
          { label: 'Triggered', value: triggered.length, color: triggered.length > 0 ? 'var(--loss)' : undefined },
          { label: 'Snoozed',   value: snoozed.length },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 20px', minWidth: 100 }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.color ?? 'var(--text)' }}>
              {s.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Create alert form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden', marginBottom: 16 }}
          >
            <div className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>New alert</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Ticker</label>
                  <select value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))} className="input" style={{ width: 120 }}>
                    <option value="">Select…</option>
                    {holdings.map(h => <option key={h.ticker} value={h.ticker}>{h.ticker}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Condition</label>
                  <div style={{ display: 'flex', gap: 0, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 2, border: '1px solid var(--border)' }}>
                    {[...PRICE_TYPES, ...PCT_TYPES].map(t => (
                      <button key={t} type="button"
                        onClick={() => setForm(f => ({ ...f, type: t, target_price: '', trigger_pct: '' }))}
                        style={{
                          padding: '5px 10px', fontSize: 'var(--text-xs)', fontWeight: 500,
                          borderRadius: 'calc(var(--radius-sm) - 1px)', border: 'none', cursor: 'pointer',
                          transition: 'all 0.12s', fontFamily: 'var(--font-sans)',
                          background: form.type === t ? 'var(--surface-1)' : 'transparent',
                          color: form.type === t ? 'var(--accent)' : 'var(--text-muted)',
                          boxShadow: form.type === t ? '0 1px 2px rgba(17,24,39,0.08)' : 'none',
                        }}
                      >
                        {t === 'above' ? '↑ Price' : t === 'below' ? '↓ Price' : t === 'pct_rise' ? '↑ %' : '↓ %'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {isPctType ? 'Threshold (%)' : 'Target price ($)'}
                  </label>
                  <input
                    type="number" min="0" step="any"
                    value={isPctType ? form.trigger_pct : form.target_price}
                    onChange={e => setForm(f => isPctType
                      ? { ...f, trigger_pct: e.target.value }
                      : { ...f, target_price: e.target.value })}
                    placeholder={isPctType ? '10' : '200.00'}
                    className="input font-mono" style={{ width: 100 }}
                  />
                </div>
                <button type="submit" disabled={busy} className="btn-primary">
                  {busy ? 'Adding…' : 'Add alert'}
                </button>
                {formError && <p style={{ width: '100%', fontSize: 'var(--text-xs)', color: 'var(--loss)', marginTop: 2 }}>{formError}</p>}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { id: 'active',  label: `Active (${active.length})` },
          { id: 'history', label: `Triggered (${triggered.length + snoozed.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? 'btn-outline' : 'btn-ghost'}
            style={{ fontSize: 'var(--text-sm)', ...(tab === t.id ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : {}) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Empty */}
      {tabRows.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            {tab === 'active' ? 'No active alerts' : 'No triggered alerts yet'}
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: tab === 'active' ? 20 : 0 }}>
            {tab === 'active' ? 'Create an alert above to get notified when a price hits your target' : 'Triggered alerts will appear here'}
          </p>
          {tab === 'active' && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">+ Create alert</button>
          )}
        </div>
      )}

      {/* Table */}
      {tabRows.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Ticker', 'Condition', 'Target', 'Status', ''].map((h, i) => (
                  <th key={h + i} style={{
                    padding: '10px 20px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
                    fontWeight: 400, textAlign: i < 2 ? 'left' : i === 2 ? 'right' : 'left',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabRows.map((a, i) => (
                <AlertRow key={a.id} alert={a} onDelete={deleteAlert} onSnooze={snoozeAlert} onReset={resetAlert} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
