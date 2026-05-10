import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { usePortfolio } from '../hooks/usePortfolio';

export default function InstitutionalPage() {
  const { holdings } = usePortfolio();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (holdings.length === 0) { setLoading(false); return; }
    const tickers = holdings.map(h => h.ticker);
    let cancelled = false;
    Promise.all(
      tickers.map(t => fetch(`/api/market-data/institutional/${t}`, { credentials: 'include' })
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

  const barData = holdings.map(h => {
    const holders = data[h.ticker] ?? [];
    const totalPct = holders.reduce((s, x) => s + (x.ownershipPercent ?? x.percent ?? 0), 0);
    return { ticker: h.ticker, pct: +totalPct.toFixed(2) };
  });

  if (loading) return <div className="page" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading institutional data…</div>;

  return (
    <div className="page">
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Institutional</h1>
        <p className="page-subtitle">Top institutional holder concentration by ticker</p>
      </div>

      {barData.some(d => d.pct > 0) && (
        <div className="card p-4 mb-4">
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 12 }}>Top-5 holder concentration by ticker</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis dataKey="ticker" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} width={35} unit="%" />
              <Tooltip
                contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)', fontSize: 11 }}
                formatter={v => [`${v}%`, 'Ownership']}
              />
              <Bar dataKey="pct" fill="#2563eb" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {holdings.map(h => {
          const holders = data[h.ticker] ?? [];
          return (
            <div key={h.ticker} className="card p-4">
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>{h.ticker} — top holders</p>
              {holders.length === 0 ? (
                <p className="text-muted text-xs">No data</p>
              ) : (
                <div className="space-y-1.5">
                  {holders.slice(0, 5).map((holder, i) => {
                    const pct = holder.ownershipPercent ?? holder.percent ?? 0;
                    const shares = holder.sharesHeld ?? holder.shares ?? 0;
                    return (
                      <div key={i} className="text-xs">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-white truncate max-w-[140px]">{holder.institutionName ?? holder.name ?? '—'}</span>
                          <span style={{ color: 'var(--accent)', marginLeft: 8, flexShrink: 0 }}>{pct.toFixed(2)}%</span>
                        </div>
                        <div className="h-1 bg-[var(--surface-2)] rounded-full overflow-hidden">
                          <div className="h-full bg-[#2563eb] rounded-full" style={{ width: `${Math.min(pct * 5, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
