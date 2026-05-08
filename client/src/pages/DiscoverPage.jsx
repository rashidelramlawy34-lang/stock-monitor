import { useState } from 'react';
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

export default function DiscoverPage() {
  const { candidates, generatedAt, loading, scanning, error, refresh } = useHRHR();
  const [riskFilter, setRiskFilter] = useState('All');
  const [sortBy, setSortBy] = useState('conviction');

  const riskLevels = ['All', 'Low', 'Medium', 'High', 'Very High'];

  const filtered = candidates
    .filter(c => riskFilter === 'All' || c.risk_label === riskFilter)
    .slice()
    .sort((a, b) => {
      if (sortBy === 'conviction') return (b.conviction ?? 0) - (a.conviction ?? 0);
      if (sortBy === 'beta') return (b.beta ?? 0) - (a.beta ?? 0);
      if (sortBy === 'risk') return (RISK_ORDER[b.risk_label] ?? 0) - (RISK_ORDER[a.risk_label] ?? 0);
      if (sortBy === 'score') return (b.score ?? 0) - (a.score ?? 0);
      return 0;
    });

  const RISK_CHIP = {
    'All':       'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    'Low':       'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    'Medium':    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    'High':      'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    'Very High': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Discover</h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-0.5">
            High-risk, high-reward picks discovered from your portfolio's peer universe
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={scanning}
          className="btn-primary shrink-0 flex items-center gap-2"
        >
          {scanning
            ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Scanning…</>
            : '↻ Refresh Scan'}
        </button>
      </div>

      {/* Meta + filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {generatedAt && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Last scanned: <span className="text-slate-600 dark:text-slate-400">{timeAgo(generatedAt)}</span>
          </span>
        )}
        <span
          className="text-xs text-slate-400 dark:text-slate-500 underline decoration-dotted cursor-help"
          title="Scores peers of your holdings by analyst buy-ratio (30%), beta (30%), and composite score (40%). Top 12 are sent to Claude for deep analysis."
        >
          How it works ℹ
        </span>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* Risk filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {riskLevels.map(r => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                  riskFilter === r
                    ? RISK_CHIP[r] + ' ring-1 ring-offset-1 ring-current'
                    : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="input py-1 text-xs w-auto pr-6"
          >
            <option value="conviction">Sort: Conviction</option>
            <option value="score">Sort: Score</option>
            <option value="beta">Sort: Beta</option>
            <option value="risk">Sort: Risk</option>
          </select>
        </div>
      </div>

      {error && <div className="card p-4 text-bear text-sm mb-6">Error: {error}</div>}

      {/* Scanning skeleton */}
      {(scanning && candidates.length === 0) || (loading && !scanning) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-56">
              <div className="flex justify-between mb-3">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/5" />
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5 mb-6" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : null}

      {/* Empty state */}
      {!loading && !scanning && filtered.length === 0 && !error && candidates.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            No candidates yet. Make sure you have holdings in your portfolio, then run a scan.
          </p>
          <button onClick={refresh} className="btn-primary">Run First Scan</button>
        </div>
      )}

      {/* No results for filter */}
      {!loading && !scanning && filtered.length === 0 && candidates.length > 0 && (
        <div className="card p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No candidates match <strong>{riskFilter}</strong> risk. Try a different filter.
          </p>
        </div>
      )}

      {/* Cards grid */}
      {filtered.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${scanning ? 'opacity-50 pointer-events-none' : ''}`}>
          {filtered.map(c => (
            <HRHRCard key={c.ticker} candidate={c} />
          ))}
        </div>
      )}

      {/* Count indicator */}
      {candidates.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-600 mt-4 text-center">
          Showing {filtered.length} of {candidates.length} candidates
        </p>
      )}
    </div>
  );
}
