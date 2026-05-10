import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTrades } from '../hooks/useTrades.js';

function fmt(n, d = 2) {
  return n != null ? Number(n).toFixed(d) : '—';
}

function detectWashSales(rows) {
  const washSet = new Set();
  const sells = rows.filter(r => r.unrealized !== null && r.unrealized < 0);

  for (const loss of sells) {
    for (const row of rows) {
      if (row.ticker !== loss.ticker) continue;
      const gap = Math.abs(row.tradeId - loss.tradeId);
      if (gap === 0) continue;
      const buyDate = row.traded_at ?? 0;
      const sellDate = loss.traded_at ?? 0;
      const diff = Math.abs(buyDate - sellDate) / 86400;
      if (diff <= 30) {
        washSet.add(loss.tradeId);
        break;
      }
    }
  }
  return washSet;
}

function TaxOptimizer({ trades }) {
  const [prices, setPrices] = useState({});

  const tickers = [...new Set(trades.map(t => t.ticker))];

  // eslint-disable-next-line
  useState(() => {
    if (tickers.length === 0) return;
    fetch(`/api/prices?tickers=${tickers.join(',')}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : {})
      .then(d => setPrices(d))
      .catch(() => {});
  });

  const now = Date.now() / 1000;

  const lots = {};
  for (const t of trades) {
    if (!lots[t.ticker]) lots[t.ticker] = { buys: [], sells: [] };
    if (t.action === 'buy') lots[t.ticker].buys.push({ ...t });
    else lots[t.ticker].sells.push({ ...t });
  }

  const rows = [];
  for (const [ticker, { buys, sells }] of Object.entries(lots)) {
    const queue = buys.map(b => ({ ...b, remainingShares: b.shares }));
    for (const sell of sells) {
      let remaining = sell.shares;
      while (remaining > 0 && queue.length > 0) {
        const lot = queue[0];
        const used = Math.min(lot.remainingShares, remaining);
        lot.remainingShares -= used;
        remaining -= used;
        if (lot.remainingShares <= 0) queue.shift();
      }
    }

    const currentPrice = prices[ticker]?.price ?? null;
    for (const lot of queue) {
      if (lot.remainingShares <= 0) continue;
      const costBasis = lot.price * lot.remainingShares;
      const currentValue = currentPrice ? currentPrice * lot.remainingShares : null;
      const unrealized = currentValue !== null ? currentValue - costBasis : null;
      const holdingDays = Math.floor((now - lot.traded_at) / 86400);
      const isLongTerm = holdingDays >= 365;
      rows.push({ ticker, shares: lot.remainingShares, costPerShare: lot.price, costBasis, currentPrice, currentValue, unrealized, holdingDays, isLongTerm, tradeId: lot.id, traded_at: lot.traded_at });
    }
  }

  const washSaleIds = detectWashSales(rows);
  const gainRows = rows.filter(r => r.unrealized !== null && r.unrealized > 0);
  const lossRows = rows.filter(r => r.unrealized !== null && r.unrealized < 0);
  const ltLoss = lossRows.filter(r => r.isLongTerm);
  const stLoss = lossRows.filter(r => !r.isLongTerm);
  const ltGain = gainRows.filter(r => r.isLongTerm);
  const stGain = gainRows.filter(r => !r.isLongTerm);

  if (rows.length === 0) return <p className="p-6 text-muted text-sm">No open lots found. Log some buy trades first.</p>;

  return (
    <div>
      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 p-4 border-b border-[var(--border)]">
        <div className="text-xs">
          <span className="text-muted">LT Losses: </span>
          <span className="text-bear font-bold">${Math.abs(ltLoss.reduce((s, r) => s + (r.unrealized ?? 0), 0)).toFixed(0)}</span>
        </div>
        <div className="text-xs">
          <span className="text-muted">ST Losses: </span>
          <span className="text-bear font-bold">${Math.abs(stLoss.reduce((s, r) => s + (r.unrealized ?? 0), 0)).toFixed(0)}</span>
        </div>
        <div className="text-xs">
          <span className="text-muted">LT Gains: </span>
          <span className="text-bull font-bold">${ltGain.reduce((s, r) => s + (r.unrealized ?? 0), 0).toFixed(0)}</span>
        </div>
        <div className="text-xs">
          <span className="text-muted">ST Gains: </span>
          <span className="text-bull font-bold">${stGain.reduce((s, r) => s + (r.unrealized ?? 0), 0).toFixed(0)}</span>
        </div>
        {washSaleIds.size > 0 && (
          <div className="text-xs ml-auto">
            <span className="text-warn font-bold">⚠ {washSaleIds.size} potential wash sale{washSaleIds.size > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-muted">
              <th className="text-left px-4 py-2 font-medium">Ticker</th>
              <th className="text-right px-4 py-2 font-medium">Shares</th>
              <th className="text-right px-4 py-2 font-medium">Cost/sh</th>
              <th className="text-right px-4 py-2 font-medium">Current</th>
              <th className="text-right px-4 py-2 font-medium">Unrealized</th>
              <th className="text-right px-4 py-2 font-medium">Days</th>
              <th className="text-right px-4 py-2 font-medium">Term</th>
              <th className="text-right px-4 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.sort((a, b) => (a.unrealized ?? 0) - (b.unrealized ?? 0)).map((r, i) => {
              const isWash = washSaleIds.has(r.tradeId);
              return (
                <tr key={i} className={`table-row-hover ${isWash ? 'bg-[var(--warn-soft)]' : ''}`}>
                  <td className="px-4 py-2 font-mono font-bold" style={{ color: 'var(--text)' }}>{r.ticker}</td>
                  <td className="px-4 py-2 text-right text-white">{fmt(r.shares, 4)}</td>
                  <td className="px-4 py-2 text-right text-muted">${fmt(r.costPerShare)}</td>
                  <td className="px-4 py-2 text-right text-muted">{r.currentPrice ? `$${fmt(r.currentPrice)}` : '—'}</td>
                  <td className={`px-4 py-2 text-right font-bold ${r.unrealized === null ? 'text-muted' : r.unrealized >= 0 ? 'text-bull' : 'text-bear'}`}>
                    {r.unrealized !== null ? `${r.unrealized >= 0 ? '+' : ''}$${fmt(Math.abs(r.unrealized))}` : '—'}
                  </td>
                  <td className="px-4 py-2 text-right text-muted">{r.holdingDays}d</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${r.isLongTerm ? 'text-[var(--gain)] bg-[var(--gain-soft)]' : 'text-warn bg-[var(--warn-soft)]'}`}>
                      {r.isLongTerm ? 'LT' : 'ST'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {isWash
                      ? <span className="text-warn text-[10px] font-bold" title="Potential wash sale — repurchase within 30 days of a loss sale">⚠ WASH</span>
                      : r.unrealized !== null && r.unrealized < 0
                        ? <span style={{ color: 'var(--accent)', fontSize: 10, fontWeight: 700 }}>Harvest</span>
                        : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted p-3 border-t border-[var(--border)]">
        HARVEST = unrealized loss you can sell to offset gains. ⚠ WASH = possible wash sale rule violation. Consult a tax advisor before acting.
      </p>
    </div>
  );
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));

  const col = (row, names) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i >= 0) return row[i]?.replace(/"/g, '').trim() ?? '';
    }
    return '';
  };

  const trades = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    const ticker = col(row, ['symbol', 'ticker', 'instrument']).toUpperCase();
    const action = col(row, ['side', 'action', 'type', 'trans type']).toLowerCase().includes('sell') ? 'sell' : 'buy';
    const shares = parseFloat(col(row, ['quantity', 'shares', 'qty']));
    const price = parseFloat(col(row, ['price', 'avg price', 'average price', 'execution price']));
    const fees = parseFloat(col(row, ['fees', 'commission', 'fee'])) || 0;
    const dateRaw = col(row, ['date', 'trade date', 'activity date', 'process date']);
    const traded_at = dateRaw ? Math.floor(new Date(dateRaw).getTime() / 1000) : undefined;
    if (!ticker || isNaN(shares) || isNaN(price)) continue;
    trades.push({ ticker, action, shares, price, fees, traded_at });
  }
  return trades;
}

export default function TradeLogPage() {
  const { trades, summary, loading, error, addTrade, deleteTrade } = useTrades();
  const [activeTab, setActiveTab] = useState('history');

  const [form, setForm] = useState({
    ticker: '', action: 'buy', shares: '', price: '', fees: '', traded_at: '', note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const fileRef = useRef();

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

  const handleCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      setCsvResult({ error: 'No valid trades found. Check the CSV format.' });
      return;
    }
    setCsvImporting(true);
    setCsvResult(null);
    let ok = 0, fail = 0;
    for (const t of parsed) {
      try { await addTrade(t); ok++; }
      catch { fail++; }
    }
    setCsvImporting(false);
    setCsvResult({ ok, fail });
    e.target.value = '';
  };

  return (
    <div className="page">
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 className="page-title">Trade log</h1>
          <p className="page-subtitle">Record buy/sell transactions and track realized P&L</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={csvImporting}
            className="btn-outline text-xs flex items-center gap-1"
          >
            {csvImporting ? 'Importing…' : '↑ Import CSV'}
          </button>
        </div>
      </div>

      {csvResult && (
        <div className={`card p-3 mb-4 text-sm ${csvResult.error ? 'text-bear' : 'text-[var(--accent)]'}`}>
          {csvResult.error ?? `Imported ${csvResult.ok} trade${csvResult.ok !== 1 ? 's' : ''}${csvResult.fail > 0 ? `, ${csvResult.fail} failed` : ''}.`}
        </div>
      )}

      {/* Log trade form */}
      <form onSubmit={handleSubmit} className="card p-5 mb-6">
        <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Log trade</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <input
            name="ticker" value={form.ticker} onChange={handleChange}
            placeholder="Ticker" className="input font-mono uppercase" maxLength={10}
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

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {['history', 'tax'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'btn-outline' : 'btn-ghost'}
            style={{ fontSize: 'var(--text-sm)', ...(activeTab === tab ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : {}) }}
          >
            {tab === 'history' ? 'Trade History' : 'Tax Optimizer'}
          </button>
        ))}
      </div>

      {activeTab === 'tax' && (
        <div className="card overflow-hidden mb-6">
          <div className="p-4 border-b border-[var(--border)]">
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Tax lot optimizer</h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Open lots from buy trades, sorted by unrealized P&L</p>
          </div>
          <TaxOptimizer trades={trades} />
        </div>
      )}

      {activeTab === 'history' && (
        <>
          {summary.length > 0 && (
            <div className="card mb-6 overflow-hidden">
              <div className="p-4 border-b border-[var(--border)]">
                <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>Realized P&L summary</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th style={{ padding: '10px 16px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 400, textAlign: 'left' }}>Ticker</th>
                      <th style={{ padding: '10px 16px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 400, textAlign: 'right' }}>Realized P&L</th>
                      <th style={{ padding: '10px 16px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 400, textAlign: 'right' }}>Total bought</th>
                      <th style={{ padding: '10px 16px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 400, textAlign: 'right' }}>Total sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map(s => (
                      <tr key={s.ticker} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]">
                        <td className="py-2.5 px-4 font-mono font-bold" style={{ color: 'var(--text)' }}>{s.ticker}</td>
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

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>Transaction history ({trades.length})</h2>
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
                    <tr className="border-b border-[var(--border)]">
                      {['Date', 'Ticker', 'Action', 'Shares', 'Price', 'Fees', 'Total', ''].map((h, i) => (
                        <th key={h + i} style={{ padding: '10px 16px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 400, textAlign: i < 3 ? 'left' : 'right' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t, i) => {
                      const total = t.action === 'buy'
                        ? t.shares * t.price + t.fees
                        : t.shares * t.price - t.fees;
                      return (
                        <motion.tr key={t.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.03 }}
                          className="border-b border-[var(--border)] table-row-hover">
                          <td className="py-2.5 px-4 font-mono text-muted text-xs">
                            {new Date(t.traded_at * 1000).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold" style={{ color: 'var(--text)' }}>{t.ticker}</td>
                          <td className="py-2.5 px-4">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                              t.action === 'buy'
                                ? 'bg-[var(--gain-soft)] text-bull border-[var(--border)]'
                                : 'bg-[var(--loss-soft)] text-bear border-[var(--border)]'
                            }`}>
                              {t.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-[var(--text-2)]">{fmt(t.shares, 4)}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-[var(--text-2)]">${fmt(t.price)}</td>
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
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
