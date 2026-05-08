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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="hud-title text-xl mb-6">Alerts</h1>

      {/* Create form */}
      <div className="card p-5 mb-6">
        <h2 className="hud-label mb-4">Create Alert</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
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

          <div className="flex flex-col gap-1">
            <label className="hud-label">Direction</label>
            <div className="flex rounded-sm overflow-hidden border border-[rgba(0,212,255,0.2)]">
              {['above', 'below'].map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`px-3 py-1.5 text-xs font-bold transition-all tracking-widest uppercase ${
                    form.type === t
                      ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff]'
                      : 'text-muted hover:text-[#a8d8ea] hover:bg-[rgba(0,212,255,0.05)]'
                  }`}
                >
                  {t === 'above' ? '↑ Above' : '↓ Below'}
                </button>
              ))}
            </div>
          </div>

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

          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Adding…' : '+ Add Alert'}
          </button>
          {formError && <p className="w-full text-bear text-xs mt-0.5">{formError}</p>}
        </form>
      </div>

      {/* Alert list */}
      {loading && <p className="text-muted text-sm">Loading…</p>}
      {!loading && all.length === 0 && (
        <p className="text-muted text-sm">No alerts set. Create one above.</p>
      )}

      {all.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="hud-label text-left py-2.5 px-4 font-normal">Ticker</th>
                <th className="hud-label text-left py-2.5 px-4 font-normal">Direction</th>
                <th className="hud-label text-right py-2.5 px-4 font-normal">Target</th>
                <th className="hud-label text-left py-2.5 px-4 font-normal">Status</th>
                <th className="py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {all.map(a => (
                <tr key={a.id} className="table-row-hover">
                  <td className="py-3 px-4 font-mono font-bold text-[#00d4ff] tracking-widest">{a.ticker}</td>
                  <td className="py-3 px-4 text-[rgba(0,212,255,0.5)]">
                    {a.type === 'above' ? '↑ Above' : '↓ Below'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#a8d8ea]">${Number(a.target_price).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    {a.triggered
                      ? <span className="badge-neutral">Triggered</span>
                      : <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-[rgba(0,212,255,0.05)] text-muted border border-[rgba(0,212,255,0.15)] tracking-wider uppercase">Watching</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => deleteAlert(a.id)}
                      className="text-muted hover:text-bear transition-colors"
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
