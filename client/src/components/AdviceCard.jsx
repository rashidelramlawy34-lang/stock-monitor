import { useState } from 'react';

const REC = {
  buy:  { label: 'BUY',  borderColor: '#00e676', badge: 'badge-bull' },
  hold: { label: 'HOLD', borderColor: '#ffaa00', badge: 'badge-neutral' },
  sell: { label: 'SELL', borderColor: '#ff3355', badge: 'badge-bear' },
};

export default function AdviceCard({ ticker, advice, loading, error, onRefresh, fundamentals }) {
  const [tab, setTab] = useState('reasoning');
  const rec = advice ? (REC[advice.recommendation] ?? REC.hold) : null;
  const confidence = advice ? Math.round((advice.confidence ?? 0) * 100) : 0;
  const age = advice?.generated_at
    ? Math.round((Date.now() / 1000 - advice.generated_at) / 60)
    : null;

  const barColor = advice?.recommendation === 'buy' ? '#00e676'
    : advice?.recommendation === 'sell' ? '#ff3355' : '#ffaa00';

  const risks = (() => { try { return JSON.parse(advice?.key_risks ?? '[]'); } catch { return []; } })();
  const catalysts = (() => { try { return JSON.parse(advice?.key_catalysts ?? '[]'); } catch { return []; } })();

  const companyName = fundamentals?.company_name;
  const sector = fundamentals?.sector;
  const pe = fundamentals?.pe_ratio;
  const beta = fundamentals?.beta;

  return (
    <div
      className="card p-5 flex flex-col gap-4 border-l-4"
      style={{ borderLeftColor: rec?.borderColor ?? 'rgba(0,212,255,0.2)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-mono font-bold text-[#00d4ff] text-lg tracking-widest">{ticker}</span>
          {(companyName || sector) && (
            <p className="text-xs text-muted mt-0.5 truncate">
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

      {/* Fundamentals strip */}
      {(pe != null || beta != null) && (
        <div className="flex gap-4 text-xs text-muted">
          {pe != null && <span>P/E <span className="font-mono text-[#a8d8ea]">{pe.toFixed(1)}</span></span>}
          {beta != null && <span>β <span className="font-mono text-[#a8d8ea]">{beta.toFixed(2)}</span></span>}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-[rgba(0,212,255,0.08)] rounded w-3/4" />
          <div className="h-3 bg-[rgba(0,212,255,0.08)] rounded w-1/2" />
          <div className="h-3 bg-[rgba(0,212,255,0.08)] rounded w-2/3" />
        </div>
      )}

      {error && <p className="text-bear text-xs">Error: {error}</p>}

      {!loading && !error && !advice && (
        <button
          onClick={() => onRefresh(ticker)}
          className="text-xs text-arc hover:underline text-left"
        >
          Generate AI analysis →
        </button>
      )}

      {!loading && advice && (
        <>
          {/* Confidence bar */}
          <div>
            <div className="flex justify-between text-xs text-muted mb-1.5">
              <span className="hud-label text-[9px]">Confidence</span>
              <span className="font-mono text-[#a8d8ea]">{confidence}%</span>
            </div>
            <div className="h-1.5 bg-[rgba(0,212,255,0.08)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${confidence}%`, backgroundColor: barColor, boxShadow: `0 0 8px ${barColor}80` }}
              />
            </div>
          </div>

          {/* Price target + stop loss */}
          {(advice.price_target || advice.stop_loss) && (
            <div className="flex gap-4 text-xs">
              {advice.price_target && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted">12m Target</span>
                  <span className="font-semibold text-bull font-mono">${advice.price_target.toFixed(2)} ↑</span>
                </div>
              )}
              {advice.stop_loss && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted">Stop Loss</span>
                  <span className="font-semibold text-bear font-mono">${advice.stop_loss.toFixed(2)} ↓</span>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          {(advice.bull_case || advice.bear_case) && (
            <div className="flex gap-0 border border-[rgba(0,212,255,0.2)] rounded-sm overflow-hidden text-xs font-medium w-fit">
              {['reasoning', 'bull', 'bear'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 transition-colors capitalize tracking-wide ${
                    tab === t
                      ? t === 'bull' ? 'bg-[#00e676]/15 text-[#00e676] border-[#00e676]/30'
                        : t === 'bear' ? 'bg-[#ff3355]/15 text-[#ff3355]'
                        : 'bg-[rgba(0,212,255,0.1)] text-[#00d4ff]'
                      : 'text-muted hover:text-[#a8d8ea] hover:bg-[rgba(0,212,255,0.04)]'
                  }`}
                >
                  {t === 'bull' ? '↑ Bull' : t === 'bear' ? '↓ Bear' : 'Analysis'}
                </button>
              ))}
            </div>
          )}

          <p className="text-sm text-[#a8d8ea] leading-relaxed">
            {tab === 'bull' ? (advice.bull_case || advice.reasoning)
              : tab === 'bear' ? (advice.bear_case || advice.reasoning)
              : advice.reasoning}
          </p>

          {/* Catalysts */}
          {catalysts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {catalysts.map((c, i) => (
                <span key={i} className="tag-catalyst">{c}</span>
              ))}
            </div>
          )}

          {/* Risks */}
          {risks.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {risks.map((r, i) => (
                <span key={i} className="tag-risk">{r}</span>
              ))}
            </div>
          )}

          {age !== null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">
                {age < 1 ? 'Generated just now' : age < 60 ? `Generated ${age}m ago` : `Generated ${Math.floor(age / 60)}h ago`}
              </span>
              {age > 1440 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-[#ffaa00]/10 text-warn border border-[#ffaa00]/30 tracking-wider">
                  STALE
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
