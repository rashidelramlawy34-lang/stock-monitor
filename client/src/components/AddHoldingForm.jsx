import { useState } from 'react';

export default function AddHoldingForm({ onAdd, open, onClose }) {
  const [form, setForm] = useState({ ticker: '', shares: '', cost_basis: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.ticker.trim()) return setError('Ticker is required');
    if (Number(form.shares) <= 0) return setError('Shares must be > 0');
    if (Number(form.cost_basis) < 0) return setError('Cost basis must be ≥ 0');

    setBusy(true);
    try {
      await onAdd(form);
      setForm({ ticker: '', shares: '', cost_basis: '' });
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const totalCost = Number(form.shares) > 0 && Number(form.cost_basis) > 0
    ? Number(form.shares) * Number(form.cost_basis)
    : null;

  return (
    <div style={{ padding: '14px 20px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ticker</label>
            <input
              className="input w-24 uppercase font-mono"
              placeholder="AAPL"
              value={form.ticker}
              onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
              maxLength={10}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Shares</label>
            <input
              type="number" min="0" step="any"
              className="input w-24 font-mono"
              placeholder="10"
              value={form.shares}
              onChange={e => setForm(f => ({ ...f, shares: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cost / share ($)</label>
            <input
              type="number" min="0" step="any"
              className="input w-28 font-mono"
              placeholder="150.00"
              value={form.cost_basis}
              onChange={e => setForm(f => ({ ...f, cost_basis: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? 'Adding…' : 'Add'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          </div>
        </div>
        {error && <p style={{ fontSize: 12, color: 'var(--loss)', marginTop: 8 }}>{error}</p>}
        {!error && totalCost && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            Total cost:{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontWeight: 600 }}>
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        )}
      </form>
    </div>
  );
}
