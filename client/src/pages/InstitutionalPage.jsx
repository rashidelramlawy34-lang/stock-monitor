import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { usePortfolio } from '../hooks/usePortfolio';

const DEMO_HOLDERS = {
  AAPL: [
    ['Vanguard Group', 8.71, 1329000000],
    ['BlackRock', 7.42, 1132000000],
    ['Berkshire Hathaway', 5.86, 895000000],
    ['State Street', 3.91, 596000000],
    ['FMR', 2.04, 311000000],
  ],
  MSFT: [
    ['Vanguard Group', 8.88, 660000000],
    ['BlackRock', 7.31, 543000000],
    ['State Street', 3.96, 294000000],
    ['FMR', 2.91, 216000000],
    ['Geode Capital', 2.12, 158000000],
  ],
  NVDA: [
    ['Vanguard Group', 8.33, 2040000000],
    ['BlackRock', 7.38, 1810000000],
    ['FMR', 4.20, 1030000000],
    ['State Street', 3.71, 910000000],
    ['Geode Capital', 2.19, 537000000],
  ],
  GOOGL: [
    ['Vanguard Group', 7.64, 451000000],
    ['BlackRock', 6.42, 379000000],
    ['State Street', 3.73, 220000000],
    ['FMR', 2.81, 166000000],
    ['T. Rowe Price', 1.68, 99000000],
  ],
  AMZN: [
    ['Vanguard Group', 7.51, 780000000],
    ['BlackRock', 6.08, 631000000],
    ['State Street', 3.30, 343000000],
    ['FMR', 2.74, 284000000],
    ['Geode Capital', 1.85, 192000000],
  ],
  TSLA: [
    ['Vanguard Group', 7.21, 229000000],
    ['BlackRock', 5.86, 186000000],
    ['State Street', 3.25, 103000000],
    ['Geode Capital', 1.78, 56600000],
    ['Capital Research', 1.35, 42900000],
  ],
};

function fallbackHolders(ticker) {
  const rows = DEMO_HOLDERS[ticker] || [
    ['Vanguard Group', 6.8, 42000000],
    ['BlackRock', 5.9, 36500000],
    ['State Street', 3.4, 21000000],
    ['FMR', 2.2, 13600000],
    ['Geode Capital', 1.7, 10500000],
  ];
  return rows.map(([institutionName, ownershipPercent, sharesHeld]) => ({
    institutionName,
    ownershipPercent,
    sharesHeld,
    demo: true,
  }));
}

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
    const holders = (data[h.ticker]?.length ? data[h.ticker] : fallbackHolders(h.ticker));
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
              <XAxis dataKey="ticker" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} width={35} unit="%" />
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
          const holders = data[h.ticker]?.length ? data[h.ticker] : fallbackHolders(h.ticker);
          const isDemo = holders.some(x => x.demo);
          return (
            <div key={h.ticker} className="card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{h.ticker} — top holders</p>
                {isDemo && <span className="badge-neutral text-[10px]">DEMO</span>}
              </div>
              <div className="space-y-2">
                {holders.slice(0, 5).map((holder, i) => {
                  const pct = holder.ownershipPercent ?? holder.percent ?? 0;
                  const shares = holder.sharesHeld ?? holder.shares ?? 0;
                  return (
                    <div key={i} className="text-xs">
                      <div className="flex justify-between mb-0.5 gap-3">
                        <span className="text-white truncate">{holder.institutionName ?? holder.name ?? '—'}</span>
                        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{pct.toFixed(2)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden flex-1">
                          <div className="h-full bg-[#7dd3fc] rounded-full" style={{ width: `${Math.min(pct * 6, 100)}%` }} />
                        </div>
                        <span className="text-muted font-mono w-16 text-right">{shares ? `${(shares / 1000000).toFixed(0)}M` : '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
