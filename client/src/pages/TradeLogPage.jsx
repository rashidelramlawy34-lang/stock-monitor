import { useState } from 'react';
import { useTrades } from '../hooks/useTrades.js';

function fmt(n, d = 2) {
  return n != null ? Number(n).toFixed(d) : '—';
}

export default function TradeLogPage() {
  const { trades, summary, loading, error, addTrade, deleteTrade } = useTrades();

  const [form, setForm] = useState({
    ticker: '', action: 'buy', shares: '', price: '', fees: '', traded_at: '', note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ticker || !form.shares || !form.price) {
      setFormError('Ticker, shares, and price are required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await addTrade({
        ticker: form.ticker.toUpperCase(),
        action: form.action,
        shares: Number(form.shares),
        price: Number(form.price),
        fees: Number(form.fees || 0),
        traded_at: form.traded_at || undefined,
        note: form.note || undefined,
      });
      setForm({ ticker: '', action: 'buy', shares: '', price: '', fees: '', traded_at: '', note: '' });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="hud-title text-xl">Trade Log</h1>
        <p className="text-muted text-xs mt-1 tracking-wide">Record buy/sell transactions and track realized P&L</p>
      </div>

      {/* Log trade form */}
      <form onSubmit={handleSubmit} className="card p-5 mb-6">
        <h2 className="hud-label mb-4">Log Trade</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <input
            name="ticker" value={form.ticker} onChange={handleChange}
            placeholder="Ticker" className="input font-mono tracking-widest uppercase" maxLength={10}
          />
          <select name="action" value={form.action} onChange={handleChange} className="input">
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          <input
            name="shares" value={form.shares} onChange={handleChange}
            placeholder="Shares" type="number" step="any" min="0" className="input"
          />
          <input
            name="price" value={form.price} onChange={handleChange}
            placeholder="Price per share ($)" type="number" step="any" min="0" className="input"
          />
          <input
            name="fees" value={form.fees} onChange={handleChange}
            placeholder="Fees ($) — optional" type="number" step="any" min="0" className="input"
          />
          <input
            name="traded_at" value={form.traded_at} onChange={handleChange}
            type="datetime-local" className="input text-muted"
          />
          <input
            name="note" value={form.note} onChange={handleChange}
            placeholder="Note (optional)" className="input sm:col-span-2"
          />
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving…' : '+ Log Trade'}
          </button>
        </div>
        {formError && <p className="text-bear text-xs">{formError}</p>}
      </form>

      {/* Realized P&L summary */}
      {summary.length > 0 && (
        <div className="card mb-6 overflow-hidden">
          <div className="p-4 border-b border-[rgba(0,212,255,0.1)]">
            <h2 className="hud-label">Realized P&L Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,212,255,0.08)]">
                  <th className="hud-label text-left py-2.5 px-4 font-normal">Ticker</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Realized P&L</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Total Bought</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Total Sold</th>
                </tr>
              </thead>
              <tbody>
                {summary.map(s => (
                  <tr key={s.ticker} className="border-b border-[rgba(0,212,255,0.06)] hover:bg-[rgba(0,212,255,0.02)]">
                    <td className="py-2.5 px-4 font-mono font-bold text-arc tracking-widest">{s.ticker}</td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${s.realized_pgl >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {s.realized_pgl >= 0 ? '+' : ''}${fmt(s.realized_pgl)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-muted">${fmt(s.total_bought)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-muted">${fmt(s.total_sold)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trade history */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[rgba(0,212,255,0.1)]">
          <h2 className="hud-label">Transaction History ({trades.length})</h2>
        </div>

        {loading && <div className="p-6 text-muted text-sm">Loading…</div>}
        {error && <div className="p-4 text-bear text-sm">Error: {error}</div>}

        {!loading && trades.length === 0 && (
          <div className="p-8 text-center text-muted text-sm">No trades logged yet.</div>
        )}

        {!loading && trades.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,212,255,0.08)]">
                  <th className="hud-label text-left py-2.5 px-4 font-normal">Date</th>
                  <th className="hud-label text-left py-2.5 px-4 font-normal">Ticker</th>
                  <th className="hud-label text-left py-2.5 px-4 font-normal">Action</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Shares</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Price</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Fees</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Total</th>
                  <th className="py-2.5 px-4" />
                </tr>
              </thead>
              <tbody>
                {trades.map(t => {
                  const total = t.action === 'buy'
                    ? t.shares * t.price + t.fees
                    : t.shares * t.price - t.fees;
                  return (
                    <tr key={t.id} className="border-b border-[rgba(0,212,255,0.06)] hover:bg-[rgba(0,212,255,0.02)]">
                      <td className="py-2.5 px-4 font-mono text-muted text-xs">
                        {new Date(t.traded_at * 1000).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-arc tracking-widest">{t.ticker}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-sm border tracking-widest uppercase ${
                          t.action === 'buy'
                            ? 'bg-[#00e676]/10 text-bull border-[#00e676]/30'
                            : 'bg-[#ff3355]/10 text-bear border-[#ff3355]/30'
                        }`}>
                          {t.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#a8d8ea]">{fmt(t.shares, 4)}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#a8d8ea]">${fmt(t.price)}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-muted">${fmt(t.fees)}</td>
                      <td className={`py-2.5 px-4 text-right font-mono font-bold ${t.action === 'buy' ? 'text-bear' : 'text-bull'}`}>
                        {t.action === 'buy' ? '-' : '+'}${fmt(Math.abs(total))}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => deleteTrade(t.id)}
                          className="text-muted hover:text-bear transition-colors text-xs"
                          title="Delete trade"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
