import { useState, useMemo } from 'react';
import { useHRHR } from '../hooks/useHRHR';
import HRHRCard from '../components/HRHRCard';

const RISK_ORDER = { 'Low': 0, 'Medium': 1, 'High': 2, 'Very High': 3 };

function timeAgo(ts) {
  if (!ts) return null;
  const mins = Math.floor((Date.now() / 1000 - ts) / 60);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

const RISK_STYLES = {
  All:        { active: 'bg-[rgba(0,212,255,0.1)] text-[#00d4ff] border-[rgba(0,212,255,0.4)]' },
  Low:        { active: 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/40' },
  Medium:     { active: 'bg-[#ffaa00]/10 text-[#ffaa00] border-[#ffaa00]/40' },
  High:       { active: 'bg-[#ff8c00]/10 text-[#ff8c00] border-[#ff8c00]/40' },
  'Very High':{ active: 'bg-[#ff3355]/10 text-[#ff3355] border-[#ff3355]/40' },
};

export default function DiscoverPage() {
  const { candidates, generatedAt, loading, scanning, error, refresh } = useHRHR();
  const [riskFilter, setRiskFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [sortBy, setSortBy] = useState('conviction');

  const riskLevels = ['All', 'Low', 'Medium', 'High', 'Very High'];

  const sectors = useMemo(() => {
    const s = new Set();
    for (const c of candidates) if (c.sector) s.add(c.sector);
    return ['All', ...Array.from(s).sort()];
  }, [candidates]);

  const filtered = candidates
    .filter(c => riskFilter === 'All' || c.risk_label === riskFilter)
    .filter(c => sectorFilter === 'All' || c.sector === sectorFilter)
    .slice()
    .sort((a, b) => {
      if (sortBy === 'conviction') return (b.conviction ?? 0) - (a.conviction ?? 0);
      if (sortBy === 'beta') return (b.beta ?? 0) - (a.beta ?? 0);
      if (sortBy === 'risk') return (RISK_ORDER[b.risk_label] ?? 0) - (RISK_ORDER[a.risk_label] ?? 0);
      if (sortBy === 'score') return (b.score ?? 0) - (a.score ?? 0);
      return 0;
    });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="hud-title text-xl">Discover — HRHR</h1>
          <p className="text-muted text-xs mt-1 tracking-wide">
            High-risk, high-reward picks from your portfolio's peer universe
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={scanning}
          className="btn-primary shrink-0 flex items-center gap-2"
        >
          {scanning
            ? <><span className="w-3.5 h-3.5 border-2 border-[rgba(0,212,255,0.3)] border-t-[#00d4ff] rounded-full animate-spin" />Scanning…</>
            : '↻ Run Scan'}
        </button>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {generatedAt && (
          <span className="text-xs text-muted">
            Last scanned: <span className="text-[rgba(0,212,255,0.6)]">{timeAgo(generatedAt)}</span>
          </span>
        )}
        <span
          className="text-xs text-muted underline decoration-dotted cursor-help"
          title="Scores peers of your holdings by analyst buy-ratio (30%), beta (30%), and composite score (40%). Top 12 are sent to Claude for deep analysis."
        >
          How it works ℹ
        </span>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="input py-1 text-xs w-auto"
          >
            <option value="conviction">Sort: Conviction</option>
            <option value="score">Sort: Score</option>
            <option value="beta">Sort: Beta</option>
            <option value="risk">Sort: Risk</option>
          </select>
        </div>
      </div>

      {/* Risk filter */}
      <div className="flex items-center gap-1 flex-wrap mb-3">
        {riskLevels.map(r => (
          <button
            key={r}
            onClick={() => setRiskFilter(r)}
            className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all tracking-wider uppercase ${
              riskFilter === r
                ? RISK_STYLES[r]?.active ?? RISK_STYLES.All.active
                : 'bg-transparent border-[rgba(0,212,255,0.15)] text-muted hover:border-[rgba(0,212,255,0.3)] hover:text-[#a8d8ea]'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Sector filter */}
      {sectors.length > 2 && (
        <div className="flex items-center gap-1 flex-wrap mb-5">
          {sectors.map(s => (
            <button
              key={s}
              onClick={() => setSectorFilter(s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                sectorFilter === s
                  ? 'bg-[rgba(0,212,255,0.1)] text-arc border-[rgba(0,212,255,0.4)]'
                  : 'border-[rgba(0,212,255,0.15)] text-muted hover:text-arc hover:border-[rgba(0,212,255,0.3)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <div className="card p-4 text-bear text-sm mb-6">Error: {error}</div>}

      {((scanning && candidates.length === 0) || (loading && !scanning)) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-56">
              <div className="flex justify-between mb-3">
                <div className="h-5 bg-[rgba(0,212,255,0.08)] rounded w-1/4" />
                <div className="h-5 bg-[rgba(0,212,255,0.08)] rounded w-1/5" />
              </div>
              <div className="h-3 bg-[rgba(0,212,255,0.08)] rounded w-full mb-2" />
              <div className="h-3 bg-[rgba(0,212,255,0.08)] rounded w-4/5 mb-6" />
              <div className="h-2 bg-[rgba(0,212,255,0.08)] rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && !scanning && filtered.length === 0 && !error && candidates.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-muted text-sm mb-4">
            No candidates yet. Add holdings to your portfolio, then run a scan.
          </p>
          <button onClick={refresh} className="btn-primary">Run First Scan</button>
        </div>
      )}

      {!loading && !scanning && filtered.length === 0 && candidates.length > 0 && (
        <div className="card p-8 text-center">
          <p className="text-muted text-sm">
            No candidates match the current filters. Try adjusting risk or sector.
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${scanning ? 'opacity-50 pointer-events-none' : ''}`}>
          {filtered.map(c => (
            <HRHRCard key={c.ticker} candidate={c} />
          ))}
        </div>
      )}

      {candidates.length > 0 && (
        <p className="text-xs text-muted mt-4 text-center">
          Showing {filtered.length} of {candidates.length} candidates
        </p>
      )}
    </div>
  );
}
