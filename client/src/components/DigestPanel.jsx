import { useState } from 'react';

export default function DigestPanel() {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/advice/digest');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="hud-label">Portfolio Digest</h2>
        <button onClick={generate} disabled={loading} className="btn-primary text-xs">
          {loading ? 'Generating…' : summary ? 'Regenerate' : 'Generate Digest'}
        </button>
      </div>

      {error && <p className="text-bear text-xs">{error}</p>}

      {!summary && !loading && (
        <p className="text-sm text-muted">Generate a full portfolio health summary powered by Claude AI.</p>
      )}

      {loading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-[var(--surface-2)] rounded w-full" />
          <div className="h-3 bg-[var(--surface-2)] rounded w-5/6" />
          <div className="h-3 bg-[var(--surface-2)] rounded w-4/6" />
        </div>
      )}

      {summary && !loading && (
        <p className="text-sm text-[var(--text-2)] leading-relaxed">{summary}</p>
      )}
    </div>
  );
}
