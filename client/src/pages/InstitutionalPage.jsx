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

  if (loading) return <div className="p-6 text-muted text-sm">Loading institutional data...</div>;

  return (
    <div className="p-4 sm:p-6">
      <h2 className="hud-title text-sm mb-4">Institutional Ownership</h2>

      {barData.some(d => d.pct > 0) && (
        <div className="card p-4 mb-4">
          <p className="hud-label text-[10px] mb-3">Top-5 Holder Concentration by Ticker</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis dataKey="ticker" tick={{ fontSize: 10, fill: 'rgba(0,212,255,0.5)' }} />
              <YAxis tick={{ fontSize: 9, fill: 'rgba(0,212,255,0.3)' }} width={35} unit="%" />
              <Tooltip
                contentStyle={{ background: '#0a1828', border: '1px solid rgba(0,212,255,0.3)', fontSize: 11 }}
                formatter={v => [`${v}%`, 'Ownership']}
              />
              <Bar dataKey="pct" fill="rgba(0,212,255,0.5)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {holdings.map(h => {
          const holders = data[h.ticker] ?? [];
          return (
            <div key={h.ticker} className="card p-4">
              <p className="hud-label text-[10px] mb-2">{h.ticker} — Top Holders</p>
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
                          <span className="text-arc ml-2 shrink-0">{pct.toFixed(2)}%</span>
                        </div>
                        <div className="h-1 bg-[rgba(0,212,255,0.1)] rounded-full overflow-hidden">
                          <div className="h-full bg-[rgba(0,212,255,0.4)] rounded-full" style={{ width: `${Math.min(pct * 5, 100)}%` }} />
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
