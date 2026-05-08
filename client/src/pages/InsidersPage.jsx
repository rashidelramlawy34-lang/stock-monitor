import { useState, useEffect } from 'react';
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

  if (loading) return <div className="p-6 text-muted text-sm">Loading insider data...</div>;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="hud-title text-sm">Insider Transactions</h2>
        <div className="flex gap-1 flex-wrap">
          {['ALL', ...tickers].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`text-xs px-2 py-0.5 rounded-sm border transition-all ${filter === t ? 'border-[rgba(0,212,255,0.6)] text-arc bg-[rgba(0,212,255,0.08)]' : 'border-[rgba(0,212,255,0.15)] text-muted hover:text-arc'}`}
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
                <tr className="text-muted border-b border-[rgba(0,212,255,0.1)]">
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
                    <tr key={i} className="table-row-hover">
                      <td className="px-4 py-2 text-white truncate max-w-[160px]">{tx.name ?? '—'}</td>
                      <td className="px-4 py-2 font-bold text-arc">{tx.ticker}</td>
                      <td className={`px-4 py-2 font-semibold ${isBuy ? 'text-[#00e676]' : 'text-bear'}`}>
                        {isBuy ? '▲ Buy' : '▼ Sell'}
                      </td>
                      <td className="px-4 py-2 text-right text-white">{shares.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-muted">{price ? `$${price.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-2 text-right text-white">{value > 0 ? `$${(value / 1000).toFixed(0)}K` : '—'}</td>
                      <td className="px-4 py-2 text-right text-muted">{date ? date.slice(0, 10) : '—'}</td>
                    </tr>
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
