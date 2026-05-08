import { useEffect } from 'react';
import { useCoach } from '../hooks/useCoach.js';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ScoreRing({ score }) {
  const r = 30, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#00e676' : score >= 45 ? '#ffaa00' : '#ff3355';

  return (
    <svg width="80" height="80" className="shrink-0">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="6" />
      <circle
        cx="40" cy="40" r={r}
        fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="40" y="44" textAnchor="middle" fill={color} fontSize="16" fontFamily="monospace" fontWeight="bold">
        {score}
      </text>
    </svg>
  );
}

const healthColor = { Aggressive: 'text-warn', Balanced: 'text-arc', Defensive: 'text-bull', Speculative: 'text-bear' };

export default function CoachPage() {
  const { analysis, loading, error, fetchCached, refresh } = useCoach();

  useEffect(() => { fetchCached(); }, [fetchCached]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="hud-title text-xl">AI Portfolio Coach</h1>
          <p className="text-muted text-xs mt-1 tracking-wide">Holistic portfolio analysis powered by JARVIS</p>
        </div>
        <div className="flex items-center gap-3">
          {analysis?.generated_at && (
            <span className="text-xs text-muted">Last analyzed: {timeAgo(analysis.generated_at)}</span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="btn-primary text-xs"
          >
            {loading ? 'Analyzing…' : analysis ? '↻ Re-analyze' : 'Analyze Portfolio'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card p-8 flex flex-col items-center gap-4">
          <div className="arc-reactor w-12 h-12">
            <div className="w-5 h-5 rounded-full bg-[rgba(0,212,255,0.2)] border border-[rgba(0,212,255,0.8)]" />
          </div>
          <p className="text-arc text-sm tracking-wide">JARVIS is analyzing your portfolio…</p>
          <p className="text-muted text-xs">This may take 10–20 seconds</p>
        </div>
      )}

      {error && <div className="card p-4 text-bear text-sm">Error: {error}</div>}

      {!loading && !analysis && !error && (
        <div className="card p-8 text-center">
          <p className="text-muted text-sm">No analysis yet.</p>
          <p className="text-muted text-xs mt-1">Click "Analyze Portfolio" to get a holistic assessment.</p>
        </div>
      )}

      {!loading && analysis && (
        <div className="flex flex-col gap-4">
          {/* Score + health */}
          <div className="card p-5 flex items-center gap-6">
            <ScoreRing score={analysis.score ?? 50} />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-lg font-bold ${healthColor[analysis.overall_health] ?? 'text-arc'}`}>
                  {analysis.overall_health}
                </span>
                <span className="text-xs text-muted font-mono border border-[rgba(0,212,255,0.2)] px-2 py-0.5 rounded-sm">
                  Diversification: {analysis.diversification_score ?? '—'}/100
                </span>
              </div>
              <p className="text-sm text-[rgba(0,212,255,0.7)] leading-relaxed">{analysis.summary}</p>
            </div>
          </div>

          {/* Macro + concentration */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card p-4">
              <p className="hud-label mb-2">Macro Outlook</p>
              <p className="text-sm text-[rgba(0,212,255,0.7)] leading-relaxed">{analysis.macro_outlook}</p>
            </div>
            <div className="card p-4">
              <p className="hud-label mb-2">Concentration Risk</p>
              <p className="text-sm text-[rgba(0,212,255,0.7)] leading-relaxed">{analysis.concentration_risk}</p>
            </div>
          </div>

          {/* Top opportunity + risk */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card p-4 border-l-2 border-bull">
              <p className="hud-label mb-2 text-bull">Top Opportunity</p>
              <p className="text-sm text-[rgba(0,212,255,0.7)]">{analysis.top_opportunity}</p>
            </div>
            <div className="card p-4 border-l-2 border-bear">
              <p className="hud-label mb-2 text-bear">Top Risk</p>
              <p className="text-sm text-[rgba(0,212,255,0.7)]">{analysis.top_risk}</p>
            </div>
          </div>

          {/* Rebalance suggestions */}
          {analysis.suggested_rebalance?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-[rgba(0,212,255,0.1)]">
                <h2 className="hud-label">Rebalance Suggestions</h2>
              </div>
              <div className="divide-y divide-[rgba(0,212,255,0.06)]">
                {analysis.suggested_rebalance.map((s, i) => (
                  <div key={i} className="flex items-start gap-4 p-4">
                    <span className="font-mono font-bold text-arc tracking-widest w-14 shrink-0">{s.ticker}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-sm border shrink-0 tracking-widest uppercase ${
                      s.action === 'reduce'
                        ? 'bg-[#ff3355]/10 text-bear border-[#ff3355]/30'
                        : s.action === 'add'
                          ? 'bg-[#00e676]/10 text-bull border-[#00e676]/30'
                          : 'bg-[rgba(0,212,255,0.08)] text-arc border-[rgba(0,212,255,0.2)]'
                    }`}>
                      {s.action}
                    </span>
                    <p className="text-sm text-muted">{s.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
