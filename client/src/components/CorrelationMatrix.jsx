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

function strengthLabel(r) {
  if (r == null) return 'No data';
  const x = Math.abs(r);
  if (x >= 0.7) return r > 0 ? 'very high' : 'inverse';
  if (x >= 0.45) return r > 0 ? 'high' : 'negative';
  if (x >= 0.2) return 'moderate';
  return 'low';
}

export default function CorrelationMatrix({ holdings, candles }) {
  const tickers = holdings.map(h => h.ticker).filter(t => candles?.[t]?.closes?.length > 1).slice(0, 10);

  const matrix = useMemo(() => {
    const returns = {};
    for (const t of tickers) returns[t] = dailyReturns(candles[t].closes);
    return tickers.map(a => tickers.map(b => a === b ? 1 : pearson(returns[a], returns[b])));
  }, [tickers, candles]);

  const summary = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < tickers.length; i++) {
      for (let j = i + 1; j < tickers.length; j++) {
        const r = matrix[i]?.[j];
        if (r != null) pairs.push({ a: tickers[i], b: tickers[j], r });
      }
    }
    if (!pairs.length) return null;
    const avg = pairs.reduce((s, p) => s + Math.abs(p.r), 0) / pairs.length;
    const tightest = pairs.slice().sort((a, b) => Math.abs(b.r) - Math.abs(a.r))[0];
    const diversifier = pairs.slice().sort((a, b) => Math.abs(a.r) - Math.abs(b.r))[0];
    return { avg, tightest, diversifier };
  }, [matrix, tickers]);

  if (tickers.length < 2) return null;

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h2 style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', fontWeight: 700 }}>Correlation matrix</h2>
          <p className="text-xs text-muted">14-day return relationship across your top holdings</p>
        </div>
        {summary && (
          <div className="flex gap-2 flex-wrap text-xs">
            <span className="px-2 py-1 rounded-full border border-[var(--border)] text-muted">Avg link {summary.avg.toFixed(2)}</span>
            <span className="px-2 py-1 rounded-full border border-[var(--border)] text-muted">Tightest {summary.tightest.a}/{summary.tightest.b}</span>
            <span className="px-2 py-1 rounded-full border border-[var(--border)] text-muted">Diversifier {summary.diversifier.a}/{summary.diversifier.b}</span>
          </div>
        )}
      </div>
      <div className="correlation-scroll">
        <div className="correlation-grid" style={{ gridTemplateColumns: `92px repeat(${tickers.length}, minmax(58px, 1fr))` }}>
          <div className="correlation-axis" />
          {tickers.map(t => <div key={t} className="correlation-axis correlation-axis--top">{t}</div>)}
          {tickers.map((rowT, ri) => (
            <div key={rowT} className="contents">
              <div className="correlation-axis correlation-axis--side">{rowT}</div>
              {tickers.map((colT, ci) => {
                const r = matrix[ri][ci];
                return (
                  <div
                    key={colT}
                    title={r != null ? `${rowT} vs ${colT}: ${r.toFixed(3)} (${strengthLabel(r)})` : 'N/A'}
                    className="correlation-cell"
                    style={{ background: heatColor(r) }}
                  >
                    <span>{r != null ? r.toFixed(2) : '—'}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3 mt-3 text-[10px] text-muted flex-wrap">
        <span>+1 moves together</span>
        <span>0 diversifies</span>
        <span>-1 moves opposite</span>
        <span>Showing first {tickers.length} holdings with price history</span>
      </div>
    </div>
  );
}
