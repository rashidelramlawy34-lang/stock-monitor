import { useState } from 'react';

const REC = {
  buy:  { label: 'BUY',  borderColor: 'var(--gain)', badge: 'badge-bull' },
  hold: { label: 'HOLD', borderColor: 'var(--warn)', badge: 'badge-neutral' },
  sell: { label: 'SELL', borderColor: 'var(--loss)', badge: 'badge-bear' },
};

function localAdviceFor(ticker, fundamentals = {}) {
  const pe = fundamentals?.pe_ratio ?? 30;
  const beta = fundamentals?.beta ?? 1.1;
  const recommendation = beta > 1.8 || pe > 45 ? 'hold' : pe < 24 ? 'buy' : 'hold';
  const confidence = beta > 1.8 ? 0.58 : 0.66;
  const company = fundamentals?.company_name || ticker;
  return {
    recommendation,
    confidence,
    reasoning: `${company} is being scored with local Aura analysis while the external AI service is unavailable. Valuation, beta, and portfolio role point to a measured ${recommendation.toUpperCase()} stance until fresh model output returns.`,
    bull_case: `Upside improves if earnings momentum confirms the current valuation and the position continues adding diversification to the portfolio.`,
    bear_case: `Risk comes from multiple compression, elevated beta, or a weaker market tape that could pressure growth-heavy holdings first.`,
    key_catalysts: JSON.stringify(['earnings', 'sector momentum', 'analyst revisions']),
    key_risks: JSON.stringify(beta > 1.5 ? ['high beta', 'valuation sensitivity'] : ['macro sensitivity', 'execution risk']),
    generated_at: Math.floor(Date.now() / 1000),
    local: true,
  };
}

export default function AdviceCard({ ticker, advice, loading, error, onRefresh, fundamentals }) {
  const [tab, setTab] = useState('reasoning');
  const displayAdvice = advice || (error ? localAdviceFor(ticker, fundamentals) : null);
  const rec = displayAdvice ? (REC[displayAdvice.recommendation] ?? REC.hold) : null;
  const confidence = displayAdvice ? Math.round((displayAdvice.confidence ?? 0) * 100) : 0;
  const age = displayAdvice?.generated_at
    ? Math.round((Date.now() / 1000 - displayAdvice.generated_at) / 60)
    : null;

  const barColor = displayAdvice?.recommendation === 'buy' ? 'var(--gain)'
    : displayAdvice?.recommendation === 'sell' ? 'var(--loss)' : 'var(--warn)';

  const risks = (() => { try { return JSON.parse(displayAdvice?.key_risks ?? '[]'); } catch { return []; } })();
  const catalysts = (() => { try { return JSON.parse(displayAdvice?.key_catalysts ?? '[]'); } catch { return []; } })();

  const companyName = fundamentals?.company_name;
  const sector = fundamentals?.sector;
  const pe = fundamentals?.pe_ratio;
  const beta = fundamentals?.beta;

  return (
    <div
      className="card p-5 flex flex-col gap-4 border-l-4"
      style={{ borderLeftColor: rec?.borderColor ?? 'var(--border-2)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-mono font-bold text-[var(--accent)] text-lg">{ticker}</span>
          {(companyName || sector) && (
            <p className="text-xs text-muted mt-0.5 truncate">
              {companyName}{companyName && sector ? ' · ' : ''}{sector}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {displayAdvice?.local && <span className="badge-neutral text-xs">LOCAL</span>}
          {rec && <span className={`${rec.badge} text-xs`}>{rec.label}</span>}
          <button
            onClick={() => onRefresh(ticker)}
            className="btn-ghost text-xs"
          >
            {loading ? 'Analyzing…' : (displayAdvice ? 'Refresh' : 'Get Analysis')}
          </button>
        </div>
      </div>

      {/* Fundamentals strip */}
      {(pe != null || beta != null) && (
        <div className="flex gap-4 text-xs text-muted">
          {pe != null && <span>P/E <span className="font-mono text-[var(--text-2)]">{pe.toFixed(1)}</span></span>}
          {beta != null && <span>β <span className="font-mono text-[var(--text-2)]">{beta.toFixed(2)}</span></span>}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-[var(--surface-2)] rounded w-3/4" />
          <div className="h-3 bg-[var(--surface-2)] rounded w-1/2" />
          <div className="h-3 bg-[var(--surface-2)] rounded w-2/3" />
        </div>
      )}

      {error && (
        <p className="text-xs text-muted">
          Live AI is unavailable, so Aura is showing local demo analysis for this card.
        </p>
      )}

      {!loading && !error && !displayAdvice && (
        <button
          onClick={() => onRefresh(ticker)}
          className="text-xs text-left hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          Generate AI analysis →
        </button>
      )}

      {!loading && displayAdvice && (
        <>
          {/* Confidence bar — gradient fill with leading glow */}
          <div>
            <div className="flex justify-between text-xs text-muted mb-1.5">
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>Confidence</span>
              <span className="font-mono text-[var(--text-2)]">{confidence}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div
                style={{
                  width: `${confidence}%`,
                  height: '100%',
                  background: displayAdvice?.recommendation === 'buy'
                    ? 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)'
                    : displayAdvice?.recommendation === 'sell'
                    ? 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)'
                    : 'var(--accent-grad)',
                  borderRadius: 99,
                  boxShadow: `2px 0 8px ${barColor}`,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>

          {/* Price target + stop loss */}
          {(displayAdvice.price_target || displayAdvice.stop_loss) && (
            <div className="flex gap-4 text-xs">
              {displayAdvice.price_target && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted">12m Target</span>
                  <span className="font-semibold text-bull font-mono">${displayAdvice.price_target.toFixed(2)} ↑</span>
                </div>
              )}
              {displayAdvice.stop_loss && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted">Stop Loss</span>
                  <span className="font-semibold text-bear font-mono">${displayAdvice.stop_loss.toFixed(2)} ↓</span>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          {(displayAdvice.bull_case || displayAdvice.bear_case) && (
            <div className="flex gap-0 border border-[var(--border-2)] rounded-lg overflow-hidden text-xs font-medium w-fit">
              {['reasoning', 'bull', 'bear'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 transition-colors capitalize tracking-wide ${
                    tab === t
                      ? t === 'bull' ? 'bg-[var(--gain-soft)] text-[var(--gain)] border-[var(--border)]'
                        : t === 'bear' ? 'bg-[var(--loss-soft)] text-[var(--loss)]'
                        : 'bg-[var(--surface-2)] text-[var(--accent)]'
                      : 'text-muted hover:text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {t === 'bull' ? '↑ Bull' : t === 'bear' ? '↓ Bear' : 'Analysis'}
                </button>
              ))}
            </div>
          )}

          <p className="text-sm text-[var(--text-2)] leading-relaxed">
            {tab === 'bull' ? (displayAdvice.bull_case || displayAdvice.reasoning)
              : tab === 'bear' ? (displayAdvice.bear_case || displayAdvice.reasoning)
              : displayAdvice.reasoning}
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
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--warn-soft)] text-warn border border-[var(--border)] tracking-wider">
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
