import { useState } from 'react';

export default function AddHoldingForm({ onAdd }) {
  const [form, setForm] = useState({ ticker: '', shares: '', cost_basis: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const labelCls = 'text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider';

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Ticker</label>
        <input
          className="input w-24 uppercase"
          placeholder="AAPL"
          value={form.ticker}
          onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
          maxLength={10}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Shares</label>
        <input
          type="number" min="0" step="any"
          className="input w-24"
          placeholder="10"
          value={form.shares}
          onChange={e => setForm(f => ({ ...f, shares: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Cost/Share ($)</label>
        <input
          type="number" min="0" step="any"
          className="input w-28"
          placeholder="150.00"
          value={form.cost_basis}
          onChange={e => setForm(f => ({ ...f, cost_basis: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>&nbsp;</label>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Adding…' : 'Add Stock'}
        </button>
      </div>
      {error && <p className="w-full text-bear text-xs mt-0.5">{error}</p>}
      {!error && Number(form.shares) > 0 && Number(form.cost_basis) > 0 && (
        <p className="w-full text-xs text-slate-500 dark:text-slate-400">
          Total cost: <span className="font-semibold text-slate-700 dark:text-slate-300">
            ${(Number(form.shares) * Number(form.cost_basis)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </p>
      )}
    </form>
  );
}
