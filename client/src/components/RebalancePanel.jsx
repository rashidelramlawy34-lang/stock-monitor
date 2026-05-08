import { useState, useMemo } from 'react';

export default function RebalancePanel({ holdings = [], prices = {} }) {
  const [targets, setTargets] = useState({});
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const total = holdings.reduce((s, h) => {
      const price = prices[h.ticker]?.price ?? h.cost_basis ?? 0;
      return s + price * (h.shares ?? 0);
    }, 0);

    return holdings.map(h => {
      const price = prices[h.ticker]?.price ?? h.cost_basis ?? 0;
      const value = price * (h.shares ?? 0);
      const currentPct = total > 0 ? (value / total) * 100 : 0;
      const targetPct = targets[h.ticker] !== undefined ? Number(targets[h.ticker]) : (100 / holdings.length);
      const targetValue = (targetPct / 100) * total;
      const diff = targetValue - value;
      const shareDiff = price > 0 ? diff / price : 0;
      return { ticker: h.ticker, price, value, currentPct, targetPct, diff, shareDiff };
    });
  }, [holdings, prices, targets]);

  const totalTarget = rows.reduce((s, r) => s + r.targetPct, 0);
  const balanced = Math.abs(totalTarget - 100) < 0.01;

  function setEqual() {
    const eq = (100 / holdings.length).toFixed(2);
    const t = {};
    holdings.forEach(h => { t[h.ticker] = eq; });
    setTargets(t);
  }

  if (holdings.length === 0) return null;

  return (
    <div className="card mt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <h3 className="hud-label text-xs">Rebalancing Calculator</h3>
        <span className="text-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={setEqual} className="btn-outline text-xs">Equal Weight</button>
            {!balanced && (
              <span className="text-warn text-xs">Total: {totalTarget.toFixed(1)}% (must = 100%)</span>
            )}
            {balanced && <span className="text-[#00e676] text-xs">✓ Balanced</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted border-b border-[rgba(0,212,255,0.1)]">
                  <th className="text-left py-1.5 font-medium">Ticker</th>
                  <th className="text-right py-1.5 font-medium">Current</th>
                  <th className="text-right py-1.5 font-medium">Target %</th>
                  <th className="text-right py-1.5 font-medium">Action</th>
                  <th className="text-right py-1.5 font-medium">Shares</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.ticker} className="table-row-hover">
                    <td className="py-1.5 font-bold text-arc">{r.ticker}</td>
                    <td className="text-right py-1.5 text-muted">{r.currentPct.toFixed(1)}%</td>
                    <td className="text-right py-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={targets[r.ticker] !== undefined ? targets[r.ticker] : r.currentPct.toFixed(1)}
                        onChange={e => setTargets(t => ({ ...t, [r.ticker]: e.target.value }))}
                        className="input w-16 text-right px-1.5 py-0.5 text-xs"
                      />
                    </td>
                    <td className={`text-right py-1.5 font-semibold ${r.diff >= 0 ? 'text-[#00e676]' : 'text-bear'}`}>
                      {r.diff >= 0 ? '+' : ''}{r.diff.toFixed(2) !== '0.00' ? `$${Math.abs(r.diff).toFixed(0)}` : '—'}
                      {r.diff > 0 ? ' Buy' : r.diff < 0 ? ' Sell' : ''}
                    </td>
                    <td className="text-right py-1.5 text-muted">
                      {Math.abs(r.shareDiff) > 0.01 ? `${Math.abs(r.shareDiff).toFixed(2)} sh` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
