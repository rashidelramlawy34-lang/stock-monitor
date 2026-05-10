import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePortfolio } from '../hooks/usePortfolio';

export default function InsidersPage() {
  const { holdings } = usePortfolio();
  const [data, setData] = useState({});
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (holdings.length === 0) { setLoading(false); return; }
    const tickers = holdings.map(h => h.ticker);
    let cancelled = false;
    Promise.all(
      tickers.map(t => fetch(`/api/market-data/insiders/${t}`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : []).then(v => [t, v]))
    ).then(results => {
      if (cancelled) return;
      const map = {};
      for (const [t, v] of results) map[t] = Array.isArray(v) ? v : [];
      setData(map);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [holdings.map(h => h.ticker).join(',')]);

  const tickers = holdings.map(h => h.ticker);

  const all = tickers.flatMap(t =>
    (data[t] ?? []).map(tx => ({ ...tx, ticker: t }))
  ).sort((a, b) => new Date(b.transactionDate ?? b.date ?? 0) - new Date(a.transactionDate ?? a.date ?? 0));

  const filtered = filter === 'ALL' ? all : all.filter(t => t.ticker === filter);

  if (loading) return <div className="page" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading insider data…</div>;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Insiders</h1>
          <p className="page-subtitle">Recent insider buy and sell transactions</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['ALL', ...tickers].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={filter === t ? 'btn-outline' : 'btn-ghost'}
              style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', ...(filter === t ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : {}) }}
            >{t}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm">No insider transactions found.</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted border-b border-[var(--border)]">
                  <th className="text-left px-4 py-2 font-medium">Name</th>
                  <th className="text-left px-4 py-2 font-medium">Ticker</th>
                  <th className="text-left px-4 py-2 font-medium">Action</th>
                  <th className="text-right px-4 py-2 font-medium">Shares</th>
                  <th className="text-right px-4 py-2 font-medium">Price</th>
                  <th className="text-right px-4 py-2 font-medium">Value</th>
                  <th className="text-right px-4 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((tx, i) => {
                  const isBuy = (tx.transactionCode ?? '').toUpperCase() === 'P' || (tx.change ?? 0) > 0;
                  const shares = Math.abs(tx.share ?? tx.shares ?? tx.change ?? 0);
                  const price = tx.transactionPrice ?? tx.price ?? 0;
                  const value = shares * price;
                  const date = tx.transactionDate ?? tx.date ?? '';
                  return (
                    <motion.tr key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.025 }}
                      className="table-row-hover">
                      <td className="px-4 py-2 text-white truncate max-w-[160px]">{tx.name ?? '—'}</td>
                      <td className="px-4 py-2 font-mono font-bold" style={{ color: 'var(--text)' }}>{tx.ticker}</td>
                      <td className={`px-4 py-2 font-semibold ${isBuy ? 'text-gain' : 'text-bear'}`}>
                        {isBuy ? '▲ Buy' : '▼ Sell'}
                      </td>
                      <td className="px-4 py-2 text-right text-white">{shares.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-muted">{price ? `$${price.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-2 text-right text-white">{value > 0 ? `$${(value / 1000).toFixed(0)}K` : '—'}</td>
                      <td className="px-4 py-2 text-right text-muted">{date ? date.slice(0, 10) : '—'}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
