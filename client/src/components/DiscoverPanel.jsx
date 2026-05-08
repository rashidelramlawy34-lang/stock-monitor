import { useState } from 'react';

export default function DiscoverPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/advice/discover');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">Stock Discovery</h2>
          {data?.theme && <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{data.theme}</p>}
        </div>
        <button onClick={fetchSuggestions} disabled={loading} className="btn-primary text-xs">
          {loading ? 'Thinking…' : data ? 'Refresh' : 'Discover stocks'}
        </button>
      </div>

      {error && <p className="text-bear text-xs mb-3">Error: {error}</p>}

      {!data && !loading && (
        <p className="text-slate-500 dark:text-slate-500 text-sm">
          AI will suggest stocks that complement your current portfolio.
        </p>
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse h-20" />
          ))}
        </div>
      )}

      {data?.suggestions?.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.suggestions.map(s => (
            <div key={s.ticker} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-[#1e2d45] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-accent">{s.ticker}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{s.name}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{s.rationale}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
