import { useState } from 'react';
import { useAlerts } from '../hooks/useAlerts.js';
import { usePortfolio } from '../hooks/usePortfolio.js';

export default function AlertsPage() {
  const { active, triggered, loading, addAlert, deleteAlert } = useAlerts();
  const { holdings } = usePortfolio();
  const [form, setForm] = useState({ ticker: '', type: 'above', target_price: '' });
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.ticker) return setFormError('Select a ticker');
    if (!form.target_price || Number(form.target_price) <= 0) return setFormError('Enter a valid price');
    setBusy(true);
    try {
      await addAlert(form);
      setForm(f => ({ ...f, target_price: '' }));
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const all = [...triggered, ...active];
  const labelCls = 'text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-6">Alerts</h1>

      {/* Create form */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Create Alert</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Ticker</label>
            <select
              value={form.ticker}
              onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))}
              className="input w-32"
            >
              <option value="">Select…</option>
              {holdings.map(h => <option key={h.ticker} value={h.ticker}>{h.ticker}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Direction</label>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-[#1e2d45]">
              {['above', 'below'].map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    form.type === t
                      ? 'bg-accent text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {t === 'above' ? '↑ Above' : '↓ Below'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Target Price ($)</label>
            <input
              type="number" min="0" step="any"
              value={form.target_price}
              onChange={e => setForm(f => ({ ...f, target_price: e.target.value }))}
              placeholder="200.00"
              className="input w-28"
            />
          </div>

          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Adding…' : 'Add Alert'}
          </button>
          {formError && <p className="w-full text-bear text-xs mt-0.5">{formError}</p>}
        </form>
      </div>

      {/* Alert list */}
      {loading && <p className="text-slate-500 dark:text-slate-400 text-sm">Loading…</p>}
      {!loading && all.length === 0 && (
        <p className="text-slate-500 dark:text-slate-500 text-sm">No alerts yet. Create one above.</p>
      )}

      {all.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-[#1e2d45]">
                <th className="text-left py-2.5 px-4">Ticker</th>
                <th className="text-left py-2.5 px-4">Direction</th>
                <th className="text-right py-2.5 px-4">Target</th>
                <th className="text-left py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {all.map(a => (
                <tr key={a.id} className="table-row-hover border-t border-slate-200 dark:border-[#1e2d45] transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">{a.ticker}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {a.type === 'above' ? '↑ Above' : '↓ Below'}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">${Number(a.target_price).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    {a.triggered
                      ? <span className="badge-neutral">Triggered</span>
                      : <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Watching</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => deleteAlert(a.id)}
                      className="text-slate-400 hover:text-bear transition-colors"
                      title="Delete alert"
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
