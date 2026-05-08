import { useState } from 'react';
import { useAlerts } from '../hooks/useAlerts.js';
import { usePortfolio } from '../hooks/usePortfolio.js';

const PRICE_TYPES = ['above', 'below'];
const PCT_TYPES = ['pct_rise', 'pct_drop'];

function typeLabel(type) {
  if (type === 'above') return '↑ Above';
  if (type === 'below') return '↓ Below';
  if (type === 'pct_rise') return '↑ % Rise';
  if (type === 'pct_drop') return '↓ % Drop';
  return type;
}

function AlertRow({ alert, onDelete, onSnooze, onReset }) {
  const isPct = PCT_TYPES.includes(alert.type);
  const isSnoozed = alert.snoozed_until && alert.snoozed_until > Date.now() / 1000;
  const snoozeRemain = isSnoozed ? Math.ceil((alert.snoozed_until - Date.now() / 1000) / 3600) : 0;

  return (
    <tr className="table-row-hover">
      <td className="py-3 px-4 font-mono font-bold text-[#00d4ff] tracking-widest">{alert.ticker}</td>
      <td className="py-3 px-4 text-[rgba(0,212,255,0.5)]">{typeLabel(alert.type)}</td>
      <td className="py-3 px-4 text-right font-mono text-[#a8d8ea]">
        {isPct
          ? `${alert.trigger_pct}%`
          : alert.target_price != null ? `$${Number(alert.target_price).toFixed(2)}` : '—'}
      </td>
      <td className="py-3 px-4">
        {isSnoozed
          ? <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-[#ffaa00]/10 text-warn border border-[#ffaa00]/30 tracking-wider uppercase">
              Snoozed {snoozeRemain}h
            </span>
          : alert.triggered
            ? <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-[#ff3355]/10 text-bear border border-[#ff3355]/30 tracking-wider uppercase">Triggered</span>
            : <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-[rgba(0,212,255,0.05)] text-muted border border-[rgba(0,212,255,0.15)] tracking-wider uppercase">Watching</span>}
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {alert.triggered && !isSnoozed && (
            <button
              onClick={() => onSnooze(alert.id, 24)}
              className="text-xs text-warn hover:text-[#ffaa00] transition-colors"
              title="Snooze 24h"
            >Snooze</button>
          )}
          {(alert.triggered || isSnoozed) && (
            <button
              onClick={() => onReset(alert.id)}
              className="text-xs text-arc hover:text-[#00d4ff] transition-colors"
              title="Reset alert"
            >Reset</button>
          )}
          <button
            onClick={() => onDelete(alert.id)}
            className="text-muted hover:text-bear transition-colors"
            title="Delete"
          >✕</button>
        </div>
      </td>
    </tr>
  );
}

export default function AlertsPage() {
  const { active, triggered, snoozed, loading, addAlert, deleteAlert, snoozeAlert, resetAlert } = useAlerts();
  const { holdings } = usePortfolio();
  const [tab, setTab] = useState('active');
  const [form, setForm] = useState({ ticker: '', type: 'above', target_price: '', trigger_pct: '' });
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const isPctType = PCT_TYPES.includes(form.type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.ticker) return setFormError('Select a ticker');
    if (isPctType && (!form.trigger_pct || Number(form.trigger_pct) <= 0)) {
      return setFormError('Enter a valid percentage (e.g. 10)');
    }
    if (!isPctType && (!form.target_price || Number(form.target_price) <= 0)) {
      return setFormError('Enter a valid price');
    }
    setBusy(true);
    try {
      await addAlert(form);
      setForm(f => ({ ...f, target_price: '', trigger_pct: '' }));
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const tabRows = tab === 'active' ? active : [...triggered, ...snoozed];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="hud-title text-xl mb-6">Alerts</h1>

      {/* Create form */}
      <div className="card p-5 mb-6">
        <h2 className="hud-label mb-4">Create Alert</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
          {/* Ticker */}
          <div className="flex flex-col gap-1">
            <label className="hud-label">Ticker</label>
            <select
              value={form.ticker}
              onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))}
              className="input w-32"
            >
              <option value="">Select…</option>
              {holdings.map(h => <option key={h.ticker} value={h.ticker}>{h.ticker}</option>)}
            </select>
          </div>

          {/* Type selector */}
          <div className="flex flex-col gap-1">
            <label className="hud-label">Type</label>
            <div className="flex rounded-sm overflow-hidden border border-[rgba(0,212,255,0.2)]">
              {[...PRICE_TYPES, ...PCT_TYPES].map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, type: t, target_price: '', trigger_pct: '' }))}
                  className={`px-2.5 py-1.5 text-xs font-bold transition-all tracking-wide uppercase ${
                    form.type === t
                      ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff]'
                      : 'text-muted hover:text-[#a8d8ea] hover:bg-[rgba(0,212,255,0.05)]'
                  }`}
                >
                  {t === 'above' ? '↑ $' : t === 'below' ? '↓ $' : t === 'pct_rise' ? '↑ %' : '↓ %'}
                </button>
              ))}
            </div>
          </div>

          {/* Value input */}
          {isPctType ? (
            <div className="flex flex-col gap-1">
              <label className="hud-label">Threshold (%)</label>
              <input
                type="number" min="0.01" step="any"
                value={form.trigger_pct}
                onChange={e => setForm(f => ({ ...f, trigger_pct: e.target.value }))}
                placeholder="10"
                className="input w-24 font-mono"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="hud-label">Target Price ($)</label>
              <input
                type="number" min="0" step="any"
                value={form.target_price}
                onChange={e => setForm(f => ({ ...f, target_price: e.target.value }))}
                placeholder="200.00"
                className="input w-28 font-mono"
              />
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Adding…' : '+ Add Alert'}
          </button>
          {formError && <p className="w-full text-bear text-xs mt-0.5">{formError}</p>}
        </form>
        <p className="text-[10px] text-muted mt-3">
          % Rise/Drop uses your cost basis. E.g. "↓ % Drop" at 10% triggers when the stock drops 10% below your avg cost.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {[
          { id: 'active', label: `Active (${active.length})` },
          { id: 'history', label: `Triggered (${triggered.length + snoozed.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-xs px-3 py-1.5 rounded-sm border transition-all ${
              tab === t.id
                ? 'border-[rgba(0,212,255,0.6)] text-arc bg-[rgba(0,212,255,0.08)]'
                : 'border-[rgba(0,212,255,0.15)] text-muted hover:text-arc'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-muted text-sm">Loading…</p>}

      {!loading && tabRows.length === 0 && (
        <p className="text-muted text-sm">
          {tab === 'active' ? 'No active alerts. Create one above.' : 'No triggered alerts yet.'}
        </p>
      )}

      {tabRows.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="hud-label text-left py-2.5 px-4 font-normal">Ticker</th>
                <th className="hud-label text-left py-2.5 px-4 font-normal">Type</th>
                <th className="hud-label text-right py-2.5 px-4 font-normal">Target</th>
                <th className="hud-label text-left py-2.5 px-4 font-normal">Status</th>
                <th className="py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {tabRows.map(a => (
                <AlertRow
                  key={a.id}
                  alert={a}
                  onDelete={deleteAlert}
                  onSnooze={snoozeAlert}
                  onReset={resetAlert}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
