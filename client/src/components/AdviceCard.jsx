import { useState } from 'react';

const REC = {
  buy:  { label: 'BUY',  border: 'border-l-bull', badge: 'badge-bull' },
  hold: { label: 'HOLD', border: 'border-l-warn', badge: 'badge-neutral' },
  sell: { label: 'SELL', border: 'border-l-bear', badge: 'badge-bear' },
};

export default function AdviceCard({ ticker, advice, loading, error, onRefresh, fundamentals }) {
  const [tab, setTab] = useState('reasoning');
  const rec = advice ? (REC[advice.recommendation] ?? REC.hold) : null;
  const confidence = advice ? Math.round((advice.confidence ?? 0) * 100) : 0;
  const age = advice?.generated_at
    ? Math.round((Date.now() / 1000 - advice.generated_at) / 60)
    : null;

  const barColor = advice?.recommendation === 'buy' ? 'bg-bull'
    : advice?.recommendation === 'sell' ? 'bg-bear' : 'bg-warn';

  const risks = (() => { try { return JSON.parse(advice?.key_risks ?? '[]'); } catch { return []; } })();
  const catalysts = (() => { try { return JSON.parse(advice?.key_catalysts ?? '[]'); } catch { return []; } })();

  const companyName = fundamentals?.company_name;
  const sector = fundamentals?.sector;
  const pe = fundamentals?.pe_ratio;
  const beta = fundamentals?.beta;

  return (
    <div className={`card p-5 flex flex-col gap-4 border-l-4 ${rec?.border ?? 'border-l-slate-300 dark:border-l-slate-700'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-lg">{ticker}</span>
          {(companyName || sector) && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 truncate">
              {companyName}{companyName && sector ? ' · ' : ''}{sector}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {rec && <span className={`${rec.badge} text-xs`}>{rec.label}</span>}
          <button
            onClick={() => onRefresh(ticker)}
            className="btn-ghost text-xs"
          >
            {loading ? 'Analyzing…' : (advice ? 'Refresh' : 'Get Analysis')}
          </button>
        </div>
      </div>

      {/* Fundamentals context strip */}
      {(pe != null || beta != null) && (
        <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-500">
          {pe != null && <span>P/E <span className="font-mono text-slate-700 dark:text-slate-300">{pe.toFixed(1)}</span></span>}
          {beta != null && <span>β <span className="font-mono text-slate-700 dark:text-slate-300">{beta.toFixed(2)}</span></span>}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
        </div>
      )}

      {error && <p className="text-bear text-xs">Error: {error}</p>}

      {!loading && !error && !advice && (
        <button
          onClick={() => onRefresh(ticker)}
          className="text-xs text-accent hover:underline text-left"
        >
          Generate AI analysis →
        </button>
      )}

      {!loading && advice && (
        <>
          {/* Confidence bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Confidence</span>
              <span className="font-mono">{confidence}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${confidence}%` }} />
            </div>
          </div>

          {/* Price target + stop loss */}
          {(advice.price_target || advice.stop_loss) && (
            <div className="flex gap-4 text-xs">
              {advice.price_target && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">12m Target</span>
                  <span className="font-semibold text-bull">${advice.price_target.toFixed(2)} ↑</span>
                </div>
              )}
              {advice.stop_loss && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Stop Loss</span>
                  <span className="font-semibold text-bear">${advice.stop_loss.toFixed(2)} ↓</span>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          {(advice.bull_case || advice.bear_case) && (
            <div className="flex gap-0 border border-slate-200 dark:border-[#1e2d45] rounded-lg overflow-hidden text-xs font-medium w-fit">
              {['reasoning', 'bull', 'bear'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 transition-colors capitalize ${
                    tab === t
                      ? t === 'bull' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : t === 'bear' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {t === 'bull' ? '↑ Bull' : t === 'bear' ? '↓ Bear' : 'Analysis'}
                </button>
              ))}
            </div>
          )}

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {tab === 'bull' ? (advice.bull_case || advice.reasoning)
              : tab === 'bear' ? (advice.bear_case || advice.reasoning)
              : advice.reasoning}
          </p>

          {/* Key catalysts */}
          {catalysts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {catalysts.map((c, i) => (
                <span key={i} className="tag-catalyst">{c}</span>
              ))}
            </div>
          )}

          {/* Key risks */}
          {risks.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {risks.map((r, i) => (
                <span key={i} className="tag-risk">{r}</span>
              ))}
            </div>
          )}

          {age !== null && (
            <span className="text-xs text-slate-400 dark:text-slate-600">
              {age < 1 ? 'Generated just now' : `Generated ${age}m ago`}
            </span>
          )}
        </>
      )}
    </div>
  );
}
