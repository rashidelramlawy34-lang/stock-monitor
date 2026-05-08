import { useMemo } from 'react';

function pearson(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return null;
  const ax = a.slice(0, n), bx = b.slice(0, n);
  const meanA = ax.reduce((s, v) => s + v, 0) / n;
  const meanB = bx.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const dA = ax[i] - meanA, dB = bx[i] - meanB;
    num += dA * dB;
    da += dA * dA;
    db += dB * dB;
  }
  const denom = Math.sqrt(da * db);
  return denom === 0 ? null : num / denom;
}

function dailyReturns(closes) {
  const out = [];
  for (let i = 1; i < closes.length; i++) {
    out.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  return out;
}

function heatColor(r) {
  if (r == null) return 'rgba(255,255,255,0.05)';
  // -1 → red, 0 → dark, +1 → green
  if (r > 0) return `rgba(0,230,118,${(r * 0.6).toFixed(2)})`;
  return `rgba(255,51,85,${(Math.abs(r) * 0.6).toFixed(2)})`;
}

export default function CorrelationMatrix({ holdings, candles }) {
  const tickers = holdings.map(h => h.ticker).filter(t => candles?.[t]?.closes?.length > 1);

  const matrix = useMemo(() => {
    const returns = {};
    for (const t of tickers) returns[t] = dailyReturns(candles[t].closes);
    return tickers.map(a => tickers.map(b => a === b ? 1 : pearson(returns[a], returns[b])));
  }, [tickers, candles]);

  if (tickers.length < 2) return null;

  return (
    <div className="card p-4 mb-6">
      <h2 className="hud-label mb-3">Correlation Matrix (14-day)</h2>
      <div className="overflow-x-auto">
        <table className="text-xs font-mono">
          <thead>
            <tr>
              <th className="w-12" />
              {tickers.map(t => (
                <th key={t} className="hud-label text-center px-2 py-1 font-normal">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((rowT, ri) => (
              <tr key={rowT}>
                <td className="hud-label pr-2 py-1">{rowT}</td>
                {tickers.map((colT, ci) => {
                  const r = matrix[ri][ci];
                  return (
                    <td
                      key={colT}
                      title={r != null ? `${rowT} vs ${colT}: ${r.toFixed(3)}` : 'N/A'}
                      className="text-center px-2 py-1.5 rounded"
                      style={{ background: heatColor(r), color: 'rgba(255,255,255,0.85)' }}
                    >
                      {r != null ? r.toFixed(2) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[9px] text-muted mt-2 tracking-wide">+1 = perfect positive correlation, −1 = inverse, 0 = no correlation</p>
    </div>
  );
}
