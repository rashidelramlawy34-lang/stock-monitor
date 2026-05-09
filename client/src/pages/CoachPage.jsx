import { useEffect, useState } from 'react';
import { LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useCoach } from '../hooks/useCoach.js';

function clean(text = '') {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^[-•]\s*/gm, '')
    .replace(/`(.+?)`/g, '$1')
    .trim();
}

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
  const color = score >= 70 ? '#16a34a' : score >= 45 ? '#d97706' : '#dc2626';

  return (
    <svg width="80" height="80" className="shrink-0">
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="6" />
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

function ScoreHistoryChart({ history }) {
  if (!history || history.length < 2) return null;
  const data = history.map(h => ({ score: h.score, ts: h.generated_at }));
  const min = Math.max(0, Math.min(...data.map(d => d.score)) - 10);
  const max = Math.min(100, Math.max(...data.map(d => d.score)) + 10);

  return (
    <div className="card p-4 mb-4">
      <p className="hud-label mb-3 text-[9px]">Score History</p>
      <ResponsiveContainer width="100%" height={70}>
        <LineChart data={data}>
          <ReferenceLine y={70} stroke="rgba(0,230,118,0.2)" strokeDasharray="3 3" />
          <ReferenceLine y={45} stroke="rgba(255,170,0,0.2)" strokeDasharray="3 3" />
          <Tooltip
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 4, fontSize: 10 }}
            formatter={(v) => [v, 'Score']}
            labelFormatter={(_, payload) => payload?.[0] ? timeAgo(payload[0].payload.ts) : ''}
          />
          <Line
            type="monotone" dataKey="score"
            stroke="#3b82f6" strokeWidth={2} dot={false}
            activeDot={{ r: 3, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1 text-[9px] text-muted">
        <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[rgba(0,230,118,0.4)]" />70+ Healthy</span>
        <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[rgba(255,170,0,0.4)]" />45+ Balanced</span>
      </div>
    </div>
  );
}

const healthColor = { Aggressive: 'text-warn', Balanced: 'text-arc', Defensive: 'text-bull', Speculative: 'text-bear' };

export default function CoachPage() {
  const { analysis, loading, error, fetchCached, refresh } = useCoach();
  const [history, setHistory] = useState([]);

  useEffect(() => { fetchCached(); }, [fetchCached]);

  useEffect(() => {
    fetch('/api/coach/history', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(setHistory)
      .catch(() => {});
  }, []);

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

      <ScoreHistoryChart history={history} />

      {loading && (
        <div className="card p-8 flex flex-col items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-[var(--surface-2)] border border-[var(--accent)]" />
          </div>
          <p className="text-arc text-sm">Analyzing your portfolio…</p>
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
                <span className="text-xs text-muted font-mono border border-[var(--border-2)] px-2 py-0.5 rounded-full">
                  Diversification: {analysis.diversification_score ?? '—'}/100
                </span>
              </div>
              <p className="text-sm text-[var(--text-2)] leading-relaxed">{clean(analysis.summary)}</p>
            </div>
          </div>

          {/* Top opportunity + risk */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card p-4 border-l-2 border-l-bull">
              <p className="hud-label mb-2 text-[var(--gain)]">Top Opportunity</p>
              <p className="text-sm text-white leading-relaxed">{clean(analysis.top_opportunity)}</p>
            </div>
            <div className="card p-4 border-l-2 border-l-bear">
              <p className="hud-label mb-2 text-bear">Top Risk</p>
              <p className="text-sm text-white leading-relaxed">{clean(analysis.top_risk)}</p>
            </div>
          </div>

          {/* Macro + concentration */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card p-4">
              <p className="hud-label mb-2">Macro Outlook</p>
              <p className="text-sm text-[var(--text-2)] leading-relaxed">{clean(analysis.macro_outlook)}</p>
            </div>
            <div className="card p-4">
              <p className="hud-label mb-2">Concentration Risk</p>
              <p className="text-sm text-[var(--text-2)] leading-relaxed">{clean(analysis.concentration_risk)}</p>
            </div>
          </div>

          {/* Rebalance suggestions */}
          {analysis.suggested_rebalance?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-[var(--border)]">
                <h2 className="hud-label">Rebalance Suggestions</h2>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {analysis.suggested_rebalance.map((s, i) => (
                  <div key={i} className="flex items-start gap-4 p-4">
                    <span className="font-mono font-bold text-arc tracking-widest w-14 shrink-0">{s.ticker}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 tracking-widest uppercase ${
                      s.action === 'reduce'
                        ? 'bg-[var(--loss-soft)] text-bear border-[var(--border)]'
                        : s.action === 'add'
                          ? 'bg-[var(--gain-soft)] text-bull border-[var(--border)]'
                          : 'bg-[var(--surface-2)] text-arc border-[var(--border-2)]'
                    }`}>
                      {s.action}
                    </span>
                    <p className="text-sm text-[var(--text-2)]">{clean(s.reason)}</p>
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
